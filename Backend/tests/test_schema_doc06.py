"""Test d'intégration : schéma PostgreSQL vivant vs dictionnaire du doc 06.

Compare la migration 0001 appliquée aux exigences de
`Analyse/modelisation/docs/06-donnees.md` : tables (§2), règles transverses
(§0), index partiels et contraintes (§3), DEFERRABLE (§2.2/§7), règles
`ON DELETE` (§3/§2.2/§2.4) et append-only de `audit_log` (§2.8).

Prérequis : `docker compose up -d db` puis `alembic upgrade head`.
Sans base joignable, les tests sont ignorés (skip), pas en échec.
"""

from __future__ import annotations

from collections.abc import AsyncIterator

import pytest
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncConnection, create_async_engine

from app.core.config import get_settings

# Tables du dictionnaire §2 et des diagrammes §1 du doc 06 (36).
DOC06_TABLES = frozenset(
    {
        "audit_log",
        "categories",
        "client_accounts",
        "client_documents",
        "client_invitations",
        "client_users",
        "consents",
        "content_nodes",
        "content_versions",
        "entity_translations",
        "intervention_types",
        "languages",
        "lead_notes",
        "leads",
        "media_refs",
        "media_variants",
        "medias",
        "notifications",
        "offices",
        "outbox_emails",
        "page_sections",
        "pages",
        "partners",
        "permissions",
        "publications",
        "redirects",
        "role_permissions",
        "roles",
        "search_synonyms",
        "section_types",
        "sectors",
        "sessions",
        "site_settings",
        "team_members",
        "user_roles",
        "users",
    }
)

# Écarts approuvés — amendements doc 06 soumis à relecture :
#  - invitations      : jeton de /admin/auth/activate (contrat, Q-105/U1)
#  - login_attempts   : verrouillage après 5 échecs (doc 09 §2.2)
#  - idempotency_keys : Idempotency-Key des écritures publiques (doc 08 §5)
APPROVED_EXTRA_TABLES = frozenset({"invitations", "login_attempts", "idempotency_keys"})

# Tables citées par le doc 06 mais volontairement absentes de 0001 :
#  - conversations, messages, missions : variante B v2.2, modules désactivés (Q-005)
#  - search_index : miroir full-text, Sprint 4 (ADR-001 bis, page 07)


@pytest.fixture()
async def pg() -> AsyncIterator[AsyncConnection]:
    """Connexion à la base de dev ; skip si PostgreSQL est injoignable."""
    engine = create_async_engine(get_settings().database_url, pool_pre_ping=True)
    try:
        connection = await engine.connect()
    except Exception as exc:  # noqa: BLE001 — types d'erreur réseau variés
        await engine.dispose()
        pytest.skip(
            f"PostgreSQL injoignable ({exc.__class__.__name__}) — "
            "'docker compose up -d db' puis 'alembic upgrade head'"
        )
    try:
        yield connection
    finally:
        await connection.close()
        await engine.dispose()


async def test_tables_match_dictionary(pg: AsyncConnection) -> None:
    """§2 : toutes les tables du dictionnaire existent, aucune table non approuvée."""
    rows = await pg.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'"))
    live = {row[0] for row in rows} - {"alembic_version"}

    missing = DOC06_TABLES - live
    assert not missing, f"tables du doc 06 absentes du schema : {sorted(missing)}"

    missing_extra = APPROVED_EXTRA_TABLES - live
    assert not missing_extra, f"tables approuvees absentes : {sorted(missing_extra)}"

    unexpected = live - DOC06_TABLES - APPROVED_EXTRA_TABLES
    assert not unexpected, f"tables non documentees ni approuvees : {sorted(unexpected)}"


async def test_pk_uuid_transverse_rules(pg: AsyncConnection) -> None:
    """§0 : PK `id UUID`, sauf `languages` (PK code) et les tables de jonction."""
    rows = await pg.execute(
        text(
            """
            SELECT c.relname, a.attname, t.typname
            FROM pg_constraint con
            JOIN pg_class c ON c.oid = con.conrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            JOIN unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord) ON true
            JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = k.attnum
            JOIN pg_type t ON t.oid = a.atttypid
            WHERE con.contype = 'p' AND n.nspname = 'public'
            """
        )
    )
    pks = {row[0]: (row[1], row[2]) for row in rows}
    exceptions = {"languages", "section_types", "role_permissions", "user_roles"}
    for table in sorted((DOC06_TABLES | APPROVED_EXTRA_TABLES) - exceptions):
        assert pks.get(table) == ("id", "uuid"), (
            f"{table} : PK 'id UUID' attendue, obtenu {pks.get(table)}"
        )


async def test_deferrable_and_partial_unique_indexes(pg: AsyncConnection) -> None:
    """§2.2/§3/§7 : DEFERRABLE et index uniques partiels."""
    rows = await pg.execute(
        text("SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public'")
    )
    indexes = {row[0]: row[1] for row in rows}

    # §2.2 / §7 : réordonnancement des sections en une transaction.
    con = await pg.execute(
        text(
            "SELECT condeferrable, condeferred FROM pg_constraint WHERE conname = 'uq_section_position'"
        )
    )
    position = con.first()
    assert position is not None and position[0] and position[1], (
        "uq_section_position doit etre DEFERRABLE INITIALLY DEFERRED"
    )

    # §3 : slug unique par langue, plusieurs NULL autorisés.
    slug = indexes.get("uq_entity_translations_slug", "")
    assert slug.startswith("CREATE UNIQUE INDEX") and "slug IS NOT NULL" in slug, (
        f"uq_entity_translations_slug partiel absent : {slug!r}"
    )

    # §2.1/§7 : une seule langue défaut (index partiel, pas contrainte pleine).
    lang = indexes.get("uq_langues_default", "")
    lang_predicate = lang.split("WHERE", 1)[1] if "WHERE" in lang else ""
    assert lang.startswith("CREATE UNIQUE INDEX") and "is_default" in lang_predicate, (
        f"uq_langues_default partiel absent : {lang!r}"
    )

    # §2.7 : un seul siège, un seul fondateur.
    for name, column in (
        ("uq_offices_headquarters", "is_headquarters"),
        ("uq_team_members_founder", "is_founder"),
    ):
        definition = indexes.get(name, "")
        predicate = definition.split("WHERE", 1)[1] if "WHERE" in definition else ""
        assert definition.startswith("CREATE UNIQUE INDEX") and column in predicate, (
            f"{name} partiel absent : {definition!r}"
        )

    # §2/§3 : clé de migration unique partielle sur chaque table concernée.
    source_tables = await pg.execute(
        text(
            """
            SELECT DISTINCT c.relname
            FROM pg_attribute a
            JOIN pg_class c ON c.oid = a.attrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relkind = 'r'
              AND a.attname = 'source_key' AND a.attnum > 0 AND NOT a.attisdropped
            """
        )
    )
    for (table,) in source_tables:
        candidates = [
            definition
            for definition in indexes.values()
            if definition.startswith("CREATE UNIQUE INDEX")
            and f"ON public.{table} " in definition
            and "source_key IS NOT NULL" in definition
        ]
        assert candidates, f"{table} : index unique partiel (source_key) manquant"


async def test_check_constraints(pg: AsyncConnection) -> None:
    """§2 : les contraintes CHECK du dictionnaire sont en place."""
    rows = await pg.execute(
        text(
            "SELECT conrelid::regclass::text, conname FROM pg_constraint "
            "WHERE contype = 'c' AND connamespace = 'public'::regnamespace"
        )
    )
    present = {(row[0], row[1]) for row in rows}
    expected = {
        ("consents", "ck_consents_consent_type"),
        ("languages", "ck_langues_direction"),
        ("pages", "ck_pages_status"),
        ("pages", "ck_pages_template"),
        ("sectors", "ck_sectors_kind"),
        ("client_accounts", "ck_client_accounts_status"),
        ("outbox_emails", "ck_outbox_emails_status"),
        ("redirects", "ck_redirects_status_code"),
        ("audit_log", "ck_audit_log_actor_type"),
        ("leads", "ck_leads_status"),
        ("medias", "ck_medias_kind"),
        ("medias", "ck_medias_status"),
        ("content_nodes", "ck_content_nodes_node_type"),
        ("content_nodes", "ck_content_nodes_status"),
        ("entity_translations", "ck_entity_translations_entity_type"),
        ("entity_translations", "ck_entity_translations_status"),
        ("media_variants", "ck_media_variants_format"),
        ("publications", "ck_publications_status"),
    }
    missing = expected - present
    assert not missing, f"CHECK manquants : {sorted(missing)}"


async def test_fk_delete_rules(pg: AsyncConnection) -> None:
    """§3 : RESTRICT par défaut ; SET NULL/CASCADE seulement là où le doc l'écrit."""
    rows = await pg.execute(
        text(
            """
            SELECT c.conrelid::regclass::text, a.attname, c.confdeltype AS delete_rule
            FROM pg_constraint c
            JOIN unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord) ON true
            JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
            WHERE c.contype = 'f' AND c.connamespace = 'public'::regnamespace
            """
        )
    )
    # asyncpg rend la colonne « char » de PG en bytes.
    rules = {
        (row[0], row[1]): row[2].decode() if isinstance(row[2], bytes) else row[2] for row in rows
    }
    expected = {
        ("page_sections", "page_id"): "c",  # §2.2/§7 : CASCADE
        ("page_sections", "section_type"): "r",  # §2.2/§7 : RESTRICT
        ("leads", "assigned_to"): "n",  # §3 : SET NULL
        ("content_versions", "created_by"): "n",  # §3 : SET NULL
        ("client_documents", "uploaded_by"): "n",  # §2.4 : nettoyé si admin supprimé
    }
    for key, deltype in expected.items():
        assert rules.get(key) == deltype, (
            f"ON DELETE {key} : attendu {deltype}, obtenu {rules.get(key)}"
        )


async def test_client_tables_constraints(pg: AsyncConnection) -> None:
    """§2.4/§3 : contraintes des tables client (dont SC-404 : pas d'unicité)."""
    rows = await pg.execute(
        text("SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public'")
    )
    indexes = {row[0]: row[1] for row in rows}

    for name in (
        "uq_client_users_account_id_email",
        "uq_client_documents_storage_key",
        "uq_client_invitations_token_hash",
    ):
        assert indexes.get(name, "").startswith("CREATE UNIQUE INDEX"), (
            f"{name} manquant ou non unique"
        )

    # §3 : l'unicité (account_id, original_name) n'est PAS imposée (SC-404).
    non_unique = indexes.get("ix_client_documents_account_id_original_name", "")
    assert non_unique.startswith("CREATE INDEX"), (
        f"client_documents (account_id, original_name) ne doit pas etre unique : {non_unique!r}"
    )


async def test_idempotency_scope_key_unique(pg: AsyncConnection) -> None:
    """Doc 08 §5 : même clé + même scope = même requête (base du replay/409)."""
    row = (
        await pg.execute(
            text(
                "SELECT contype FROM pg_constraint WHERE conname = 'uq_idempotency_keys_scope_key'"
            )
        )
    ).first()
    # asyncpg rend la colonne « char » de PG en bytes.
    assert row is not None and row[0] in (b"u", "u"), "uq_idempotency_keys_scope_key manquante"


async def test_audit_log_append_only(pg: AsyncConnection) -> None:
    """§2.8 : append-only vérifiable — INSERT autorisé, UPDATE/DELETE refusés."""
    trigger = (
        await pg.execute(
            text(
                "SELECT tgname FROM pg_trigger "
                "WHERE NOT tgisinternal AND tgrelid = 'audit_log'::regclass"
            )
        )
    ).first()
    assert trigger is not None and trigger[0] == "trg_audit_log_append_only", (
        "trigger append-only absent de audit_log"
    )

    # INSERT autorisé.
    await pg.execute(
        text(
            "INSERT INTO audit_log (id, actor_type, action, entity_type) "
            "VALUES (gen_random_uuid(), 'system', 'test', 'page')"
        )
    )
    # UPDATE refusé par le trigger (la ligne existe dans la transaction).
    with pytest.raises(DBAPIError):
        await pg.execute(text("UPDATE audit_log SET action = 'modifie'"))
    await pg.rollback()

    # Nouvelle ligne : le rollback précédent l'a annulée, et DELETE doit
    # lui aussi être refusé (avant la ligne existe, sinon pas de déclenchement).
    await pg.execute(
        text(
            "INSERT INTO audit_log (id, actor_type, action, entity_type) "
            "VALUES (gen_random_uuid(), 'system', 'test', 'page')"
        )
    )
    with pytest.raises(DBAPIError):
        await pg.execute(text("DELETE FROM audit_log"))
    await pg.rollback()
