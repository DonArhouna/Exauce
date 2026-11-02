"""Tests de parité du seed — doc 06 §6.2 (table « Test de parité », L983-1003).

Deux niveaux :
- tests de payload (sans base) : le payload construit respecte la table ;
- tests d'intégration (base dev) : le seed appliqué en transaction rejouée
  (rollback à la sortie, la base de dev n'est pas modifiée) respecte la table
  et toutes les traductions correspondent au payload.

Prérequis des tests d'intégration : `docker compose up -d db` puis
`alembic upgrade head`. Sans base joignable, ils sont ignorés (skip).
"""

from __future__ import annotations

import json
import uuid
from collections.abc import AsyncIterator
from typing import Any

import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.config import get_settings
from app.models.auth import Role, User, UserRole
from app.models.content import (
    Category,
    ContentNode,
    InterventionType,
    Page,
    PageSection,
    Publication,
    SectionType,
    Sector,
)
from app.models.i18n import EntityTranslation, Language, Redirect
from app.models.site import Office, SiteSetting, TeamMember
from app.seed import build_payload, run_seed
from app.seed.payload import DATA_DIR

CONTENT_DATA = json.loads((DATA_DIR / "content_data.json").read_text(encoding="utf-8"))


# ---------------------------------------------------------------- payload ----


def test_payload_parity_table() -> None:
    """Table de parité doc 06 L983-1003, lue sur le payload (mode dev)."""
    payload = build_payload(with_demo=True)

    nodes: dict[str, int] = {}
    for node in payload.nodes:
        nodes[node["node_type"]] = nodes.get(node["node_type"], 0) + 1
    assert nodes == {"family": 2, "domain": 10, "group": 20, "service": 94}

    assert len(payload.pages) == 10
    assert sum(1 for page in payload.pages if page["is_in_nav"]) == 7
    assert len(payload.section_types) == 21
    assert len(payload.sections) == 29
    assert sum(1 for s in payload.sections if s["page_key"] == "home") == 10
    legal = [s for s in payload.sections if s["page_key"] == "legal_notice"]
    assert len(legal) == 3 and all(s["section_type"] == "legal_document" for s in legal)

    assert sum(1 for s in payload.sectors if s["kind"] == "sector") == 3
    assert sum(1 for s in payload.sectors if s["kind"] == "subcategory") == 9
    assert all(s["approved"] is False for s in payload.sectors)
    assert len(payload.categories) == 6
    assert len(payload.publications) == 3
    assert all(p["status"] == "draft" for p in payload.publications)
    assert len(payload.offices) == 1 and payload.offices[0]["is_headquarters"]
    assert len(payload.team_members) == 1 and payload.team_members[0]["is_founder"]
    assert len(payload.redirects) == 4
    assert all(r["status_code"] == 301 for r in payload.redirects)
    assert len(payload.roles) == 6
    assert {r["code"] for r in payload.roles} == {
        "super_admin",
        "admin",
        "editor",
        "reviewer",
        "crm",
        "viewer",
    }
    assert len(payload.languages) == 2

    # Pages : legale en draft + banners_pending, 3 systemes (doc 06 L569).
    by_key = {p["page_key"]: p for p in payload.pages}
    legal_page = by_key["legal_notice"]
    assert legal_page["status"] == "draft" and legal_page["banners_pending"]
    assert {key for key, page in by_key.items() if page["is_system"]} == {
        "home",
        "not_found",
        "legal_notice",
    }

    # Positions 1..N par page (parité des blocs).
    positions: dict[str, list[int]] = {}
    for section in payload.sections:
        positions.setdefault(section["page_key"], []).append(section["position"])
    for page_key, pos in positions.items():
        assert pos == list(range(1, len(pos) + 1)), page_key


def test_payload_node_slugs_match_frontend() -> None:
    """Slugs familles/domaines/groupes = frontend ; prestations generees (doc 16 §7)."""
    payload = build_payload(with_demo=True)
    expected: dict[str, dict[str, str]] = {}
    for family in CONTENT_DATA["SERVICES"]:
        expected[family["id"]] = family["slug"]
        for domain in family["domains"]:
            expected[domain["id"]] = domain["slug"]
            for group in domain["groups"]:
                expected[group["id"]] = group["slug"]

    seen_fr: set[str] = set()
    seen_en: set[str] = set()
    for node in payload.nodes:
        slug_fr = node["translations"]["fr"]["slug"]
        slug_en = node["translations"]["en"]["slug"]
        assert slug_fr and slug_en, node["source_key"]
        assert len(slug_fr) <= 120 and len(slug_en) <= 120
        source_key = node["source_key"]
        if source_key in expected:
            # Slugs figes du frontend (famille, domaine, groupe).
            assert node["translations"]["fr"]["slug"] == expected[source_key]["fr"]
            assert node["translations"]["en"]["slug"] == expected[source_key]["en"]
        else:
            # Prestation : source_key = {groupe}/{slug_fr} (doc 13 §2.1).
            assert node["node_type"] == "service"
            assert source_key.startswith(f"{node['parent_source_key']}/")
        if node["node_type"] == "service":
            assert slug_fr not in seen_fr, f"slug FR duplique: {slug_fr}"
            assert slug_en not in seen_en, f"slug EN duplique: {slug_en}"
            seen_fr.add(slug_fr)
            seen_en.add(slug_en)


def test_payload_editorial_coverage() -> None:
    """126 clés editoriales du doc 15 (127 cibles) toutes appliquees au payload."""
    payload = build_payload(with_demo=True)
    assert payload.editorial_keys == 126
    assert payload.editorial_targets == 127  # contact.address -> 2 cibles

    # Les cibles editoriales sont visibles dans les structures du payload.
    home = next(p for p in payload.pages if p["page_key"] == "home")
    assert home["translations"]["fr"]["data"]["nav_label"]
    hero = next(
        s for s in payload.sections if s["page_key"] == "home" and s["source_key"] == "hero"
    )
    assert hero["translations"]["fr"]["data"]["brand_line1"] == "EXAUCE"
    # E2 : banner_text reporte sur les 3 blocs legaux, pas dans site_settings.
    legal_sections = [s for s in payload.sections if s["page_key"] == "legal_notice"]
    for section in legal_sections:
        assert section["translations"]["fr"]["data"]["banner_text"]
    assert all(s["group_key"] != "legal" for s in payload.settings)


# ------------------------------------------------------------------ base ----


@pytest.fixture()
async def session() -> AsyncIterator[AsyncSession]:
    """Session sur la base dev ; skip si PostgreSQL est injoignable."""
    engine = create_async_engine(get_settings().database_url, pool_pre_ping=True)
    try:
        connection = await engine.connect()
    except Exception as exc:  # noqa: BLE001 — types d'erreur réseau variés
        await engine.dispose()
        pytest.skip(
            f"PostgreSQL injoignable ({exc.__class__.__name__}) — "
            "'docker compose up -d db' puis 'alembic upgrade head'"
        )
    sess = AsyncSession(bind=connection)
    try:
        yield sess
    finally:
        await sess.rollback()
        await sess.close()
        await connection.close()
        await engine.dispose()


@pytest.fixture()
async def seeded(session: AsyncSession) -> AsyncSession:
    """Seed applique en transaction (rejouée a la sortie)."""
    await run_seed(session, with_demo=True)
    return session


async def _count(session: AsyncSession, model: Any, *conditions: Any) -> int:
    stmt = select(func.count()).select_from(model)
    if conditions:
        stmt = stmt.where(*conditions)
    return int((await session.execute(stmt)).scalar_one())


async def test_db_parity_counts(seeded: AsyncSession) -> None:
    """Comptes en base = table de parité doc 06 (mode dev, --with-demo)."""
    by_type = dict(
        (
            await seeded.execute(
                select(ContentNode.node_type, func.count()).group_by(ContentNode.node_type)
            )
        ).all()
    )
    assert by_type == {"family": 2, "domain": 10, "group": 20, "service": 94}

    assert await _count(seeded, Page) == 10
    assert await _count(seeded, Page, Page.is_in_nav.is_(True)) == 7
    assert await _count(seeded, SectionType) == 21
    assert await _count(seeded, PageSection) == 29
    assert (
        await _count(
            seeded,
            PageSection,
            PageSection.page_id.in_(select(Page.id).where(Page.page_key == "home")),
        )
        == 10
    )
    assert await _count(seeded, Sector, Sector.kind == "sector") == 3
    assert await _count(seeded, Sector, Sector.kind == "subcategory") == 9
    assert await _count(seeded, Sector, Sector.approved.is_(True)) == 0
    assert await _count(seeded, Category) == 6
    assert await _count(seeded, Publication) == 3
    assert await _count(seeded, Publication, Publication.status == "draft") == 3
    assert await _count(seeded, Office) == 1
    assert await _count(seeded, Office, Office.is_headquarters.is_(True)) == 1
    assert await _count(seeded, TeamMember) == 1
    assert await _count(seeded, TeamMember, TeamMember.is_founder.is_(True)) == 1
    assert await _count(seeded, Redirect) == 4
    assert await _count(seeded, Redirect, Redirect.status_code == 301) == 4
    assert await _count(seeded, Language) == 2
    assert await _count(seeded, Language, Language.is_default.is_(True)) == 1
    assert await _count(seeded, SiteSetting) == 10
    assert await _count(seeded, SiteSetting, SiteSetting.group_key == "legal") == 0

    legal_page = (
        await seeded.execute(select(Page).where(Page.page_key == "legal_notice"))
    ).scalar_one()
    assert legal_page.status == "draft" and legal_page.banners_pending


async def test_db_translations_match_payload(seeded: AsyncSession) -> None:
    """Chaque traduction du payload existe en base, a l'identique (slug/statut/data)."""
    payload = build_payload(with_demo=True)

    def key_map(rows: list[tuple[Any, ...]]) -> dict[Any, uuid.UUID]:
        return dict(rows)

    page_ids = key_map((await seeded.execute(select(Page.page_key, Page.id))).all())
    section_ids = {
        (page_key, source_key): entity_id
        for page_key, source_key, entity_id in (
            await seeded.execute(
                select(Page.page_key, PageSection.source_key, PageSection.id).join(
                    Page, PageSection.page_id == Page.id
                )
            )
        ).all()
    }
    node_ids = key_map((await seeded.execute(select(ContentNode.source_key, ContentNode.id))).all())
    setting_ids = {
        (group_key, setting_key): entity_id
        for group_key, setting_key, entity_id in (
            await seeded.execute(
                select(SiteSetting.group_key, SiteSetting.setting_key, SiteSetting.id)
            )
        ).all()
    }
    simple_ids: dict[str, dict[Any, uuid.UUID]] = {
        "sector": key_map((await seeded.execute(select(Sector.source_key, Sector.id))).all()),
        "interventiontype": key_map(
            (await seeded.execute(select(InterventionType.source_key, InterventionType.id))).all()
        ),
        "category": key_map((await seeded.execute(select(Category.source_key, Category.id))).all()),
        "office": key_map((await seeded.execute(select(Office.source_key, Office.id))).all()),
        "team_member": key_map(
            (await seeded.execute(select(TeamMember.source_key, TeamMember.id))).all()
        ),
        "publication": key_map(
            (await seeded.execute(select(Publication.source_key, Publication.id))).all()
        ),
    }

    expected: dict[tuple[str, uuid.UUID, str], dict[str, Any]] = {}

    def add(entity_type: str, entity_id: uuid.UUID, translations: dict[str, Any]) -> None:
        for lang, spec in translations.items():
            expected[(entity_type, entity_id, lang)] = spec

    for page in payload.pages:
        add("page", page_ids[page["page_key"]], page["translations"])
    for section in payload.sections:
        add(
            "page_section",
            section_ids[(section["page_key"], section["source_key"])],
            section["translations"],
        )
    for node in payload.nodes:
        add("node", node_ids[node["source_key"]], node["translations"])
    for setting in payload.settings:
        add(
            "setting",
            setting_ids[(setting["group_key"], setting["setting_key"])],
            setting["translations"],
        )
    for entity_type, entities in (
        ("sector", payload.sectors),
        ("interventiontype", payload.intervention_types),
        ("category", payload.categories),
        ("office", payload.offices),
        ("team_member", payload.team_members),
        ("publication", payload.publications),
    ):
        for entity in entities:
            add(entity_type, simple_ids[entity_type][entity["source_key"]], entity["translations"])

    rows = (await seeded.execute(select(EntityTranslation))).scalars().all()
    live = {(row.entity_type, row.entity_id, row.lang): row for row in rows}
    assert set(live) == set(expected), "ecart de cles de traduction"
    for key, spec in expected.items():
        row = live[key]
        assert row.slug == spec["slug"], key
        assert row.status == spec["status"], key
        assert row.data == spec["data"], key

    # Valeurs non traduites des settings (doc 16 §9).
    for setting in payload.settings:
        row = (
            await seeded.execute(
                select(SiteSetting).where(
                    SiteSetting.group_key == setting["group_key"],
                    SiteSetting.setting_key == setting["setting_key"],
                )
            )
        ).scalar_one()
        assert row.value == setting["value"]
        assert row.is_translatable == setting["is_translatable"]


async def test_db_founder_and_roles(seeded: AsyncSession) -> None:
    """Compte fondateur sans mot de passe + roles semes (doc 06 §6.2, Q-105)."""
    assert await _count(seeded, Role) == 6
    users = (await seeded.execute(select(User))).scalars().all()
    assert len(users) == 1
    founder = users[0]
    assert founder.email == "fondateur@exauceac.com"
    assert founder.password_hash is None
    assert founder.must_reset_password is True
    assert founder.default_lang == "fr"

    links = (await seeded.execute(select(UserRole))).scalars().all()
    assert len(links) == 1
    role = (await seeded.execute(select(Role).where(Role.id == links[0].role_id))).scalar_one()
    assert role.code == "super_admin"
