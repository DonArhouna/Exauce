"""Moteur du seed : upserts idempotents dans la session ouverte.

`run_seed` n'effectue **aucun commit** : l'appelant (CLI ou test) committe ou
rejoue la transaction. Idempotence : une re-execution ne cree ni ne modifie
rien (0 creation, 0 mise a jour), les IDs sont stables.

Cles d'upsert : `source_key` pour les entites a clé stable (content_nodes,
sectors, intervention_types, categories, offices, team_members,
publications), clé naturelle pour le reste (pages.page_key,
page_sections.(page_id, source_key), site_settings.(group_key, setting_key),
roles.code, languages.code, redirects.old_path, users.email).
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth import Permission, Role, RolePermission, User, UserRole
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
from app.models.partners import Partner
from app.models.site import Office, SiteSetting, TeamMember
from app.seed.payload import build_payload

# (entity_type, entity_id, translations) en attente d'ecriture.
TranslationJob = tuple[str, uuid.UUID, dict[str, Any]]


@dataclass
class SeedStats:
    """Compteurs de creation / mise a jour par table."""

    created: dict[str, int] = field(default_factory=dict)
    updated: dict[str, int] = field(default_factory=dict)
    deleted: dict[str, int] = field(default_factory=dict)

    def add(self, entity: str, *, created: bool) -> None:
        target = self.created if created else self.updated
        target[entity] = target.get(entity, 0) + 1

    def add_deleted(self, entity: str) -> None:
        self.deleted[entity] = self.deleted.get(entity, 0) + 1

    @property
    def total_created(self) -> int:
        return sum(self.created.values())


async def _upsert(
    session: AsyncSession,
    model: Any,
    *,
    key: dict[str, Any],
    attrs: dict[str, Any],
    entity: str,
    stats: SeedStats,
    update_attrs: dict[str, Any] | None = None,
) -> Any:
    """Insere si absent, aligne les attributs sinon (sans UPDATE inutile).

    `update_attrs` restreint les colonnes recalculees a la re-execution :
    utilise pour les champs que le seed ne doit jamais ecraser (mot de passe,
    flags du compte fondateur).
    """
    existing = (await session.execute(select(model).filter_by(**key))).scalar_one_or_none()
    if existing is None:
        instance = model(**key, **attrs)
        session.add(instance)
        stats.add(entity, created=True)
        await session.flush()
        return instance
    applied = attrs if update_attrs is None else update_attrs
    changed = False
    for name, value in applied.items():
        if getattr(existing, name) != value:
            setattr(existing, name, value)
            changed = True
    if changed:
        stats.add(entity, created=False)
        await session.flush()
    return existing


async def _link_role(
    session: AsyncSession,
    stats: SeedStats,
    user_id: uuid.UUID,
    role_id: uuid.UUID,
) -> None:
    existing = (
        await session.execute(select(UserRole).filter_by(user_id=user_id, role_id=role_id))
    ).scalar_one_or_none()
    if existing is None:
        session.add(UserRole(user_id=user_id, role_id=role_id))
        stats.add("user_roles", created=True)
        await session.flush()


async def run_seed(
    session: AsyncSession,
    *,
    with_demo: bool = False,
    production: bool = False,
    reconcile_permissions: bool = False,
) -> SeedStats:
    """Applique le seed complet (doc 06 §6.2) — sans commit.

    `reconcile_permissions=True` (opt-in CLI `--reconcile-permissions`) retire
    les liens `role_permissions` des **6 rôles semés** absents du payload,
    après les avoir affichés. Par défaut, aucun lien n'est supprimé.
    """
    if with_demo and production:
        raise ValueError("--with-demo et --production sont mutuellement exclusifs")
    payload = build_payload(with_demo=with_demo and not production)
    stats = SeedStats()
    jobs: list[TranslationJob] = []

    for lang in payload.languages:
        await _upsert(
            session,
            Language,
            key={"code": lang["code"]},
            attrs={
                "label": lang["label"],
                "is_default": lang["is_default"],
                "is_active": True,
                "direction": "ltr",
                "sort_order": lang["sort_order"],
            },
            entity="languages",
            stats=stats,
        )

    for section_type in payload.section_types:
        await _upsert(
            session,
            SectionType,
            key={"code": section_type["code"]},
            attrs={
                "label": section_type["label"],
                "config_schema": section_type["config_schema"],
                "translation_schema": section_type["translation_schema"],
                "is_active": section_type["is_active"],
            },
            entity="section_types",
            stats=stats,
        )

    role_ids: dict[str, uuid.UUID] = {}
    for role in payload.roles:
        instance = await _upsert(
            session,
            Role,
            key={"code": role["code"]},
            attrs={"label": role["label"]},
            entity="roles",
            stats=stats,
        )
        role_ids[role["code"]] = instance.id

    # --- Permissions (doc 10 §2 + décisions 2026-11-03) : registre + liens --
    permission_ids: dict[tuple[str, str, str | None], uuid.UUID] = {}
    for perm in payload.permissions:
        instance = await _upsert(
            session,
            Permission,
            key={"module": perm["module"], "action": perm["action"], "lang": perm["lang"]},
            attrs={},
            entity="permissions",
            stats=stats,
        )
        permission_ids[(perm["module"], perm["action"], perm["lang"])] = instance.id

    for link in payload.role_permissions:
        await _upsert(
            session,
            RolePermission,
            key={
                "role_id": role_ids[link["role_code"]],
                "permission_id": permission_ids[(link["module"], link["action"], link["lang"])],
            },
            attrs={},
            entity="role_permissions",
            stats=stats,
        )

    # Réconciliation **opt-in** : le seed est autoritaire pour les 6 rôles
    # semés, mais la suppression d'un lien retiré de ROLE_PERMISSIONS (ex.
    # `editor`/`media:delete`) doit être demandée explicitement. Un rôle hors
    # des rôles semés n'est jamais touché.
    if reconcile_permissions:
        desired_links = {
            (
                role_ids[link["role_code"]],
                permission_ids[(link["module"], link["action"], link["lang"])],
            )
            for link in payload.role_permissions
        }
        role_code_by_id = {role_id: code for code, role_id in role_ids.items()}
        permission_by_id = {
            permission_id: triple for triple, permission_id in permission_ids.items()
        }
        existing_links = (
            await session.execute(
                select(RolePermission).where(RolePermission.role_id.in_(set(role_ids.values())))
            )
        ).scalars()
        for row in existing_links:
            if (row.role_id, row.permission_id) in desired_links:
                continue
            role_code = role_code_by_id[row.role_id]
            perm_module, perm_action, perm_lang = permission_by_id.get(
                row.permission_id, ("?", "?", None)
            )
            suffix = f" (lang={perm_lang})" if perm_lang else ""
            print(f"reconcile: {role_code} {perm_module}:{perm_action}{suffix}")
            await session.delete(row)
            stats.add_deleted("role_permissions")

    # --- Compte fondateur (avant les publications : author_id, Q-105/U1) ---
    founder = payload.founder
    user = await _upsert(
        session,
        User,
        key={"email": founder["email"]},
        attrs={
            "display_name": founder["display_name"],
            "password_hash": founder["password_hash"],
            "is_active": founder["is_active"],
            "mfa_active": founder["mfa_active"],
            "must_reset_password": founder["must_reset_password"],
            "default_lang": founder["default_lang"],
        },
        # Jamais de re-ecriture du hash / flags sur re-execution (Q-105/U1).
        update_attrs={"display_name": founder["display_name"]},
        entity="users",
        stats=stats,
    )
    for role_code in founder["roles"]:
        await _link_role(session, stats, user.id, role_ids[role_code])

    # --- Comptes de démo (--with-demo seulement, Q-104) : sans mot de passe -
    for demo in payload.demo_users:
        instance = await _upsert(
            session,
            User,
            key={"email": demo["email"]},
            attrs={
                "display_name": demo["display_name"],
                "password_hash": None,
                "is_active": True,
                "mfa_active": False,
                "must_reset_password": True,
                "default_lang": "fr",
            },
            update_attrs={"display_name": demo["display_name"]},
            entity="users",
            stats=stats,
        )
        await _link_role(session, stats, instance.id, role_ids[demo["role"]])

    page_ids: dict[str, uuid.UUID] = {}
    for page in payload.pages:
        instance = await _upsert(
            session,
            Page,
            key={"page_key": page["page_key"]},
            attrs={
                "template": page["template"],
                "source_key": page["source_key"],
                "is_in_nav": page["is_in_nav"],
                "nav_position": page["nav_position"],
                "is_system": page["is_system"],
                "status": page["status"],
                "banners_pending": page["banners_pending"],
            },
            entity="pages",
            stats=stats,
        )
        page_ids[page["page_key"]] = instance.id
        jobs.append(("page", instance.id, page["translations"]))

    node_ids: dict[str, uuid.UUID] = {}
    for node in payload.nodes:
        parent_source = node["parent_source_key"]
        instance = await _upsert(
            session,
            ContentNode,
            key={"source_key": node["source_key"]},
            attrs={
                "parent_id": node_ids[parent_source] if parent_source else None,
                "node_type": node["node_type"],
                "position": node["position"],
                "status": node["status"],
            },
            entity="content_nodes",
            stats=stats,
        )
        node_ids[node["source_key"]] = instance.id
        jobs.append(("node", instance.id, node["translations"]))

    for section in payload.sections:
        page_id = page_ids[section["page_key"]]
        instance = await _upsert(
            session,
            PageSection,
            key={"page_id": page_id, "source_key": section["source_key"]},
            attrs={
                "section_type": section["section_type"],
                "position": section["position"],
                "is_active": section["is_active"],
                "config": section["config"],
            },
            entity="page_sections",
            stats=stats,
        )
        jobs.append(("page_section", instance.id, section["translations"]))

    sector_ids: dict[str, uuid.UUID] = {}
    for sector in payload.sectors:
        parent_code = sector["parent_code"]
        instance = await _upsert(
            session,
            Sector,
            key={"source_key": sector["source_key"]},
            attrs={
                "kind": sector["kind"],
                "code": sector["code"],
                "parent_id": sector_ids[parent_code] if parent_code else None,
                "position": sector["position"],
                "approved": sector["approved"],
            },
            entity="sectors",
            stats=stats,
        )
        sector_ids[sector["code"]] = instance.id
        jobs.append(("sector", instance.id, sector["translations"]))

    for itype in payload.intervention_types:
        instance = await _upsert(
            session,
            InterventionType,
            key={"source_key": itype["source_key"]},
            attrs={"code": itype["code"], "sort_order": itype["sort_order"]},
            entity="intervention_types",
            stats=stats,
        )
        jobs.append(("interventiontype", instance.id, itype["translations"]))

    category_ids: dict[str, uuid.UUID] = {}
    for category in payload.categories:
        instance = await _upsert(
            session,
            Category,
            key={"source_key": category["source_key"]},
            attrs={"code": category["code"], "position": category["position"]},
            entity="categories",
            stats=stats,
        )
        category_ids[category["code"]] = instance.id
        jobs.append(("category", instance.id, category["translations"]))

    for office in payload.offices:
        instance = await _upsert(
            session,
            Office,
            key={"source_key": office["source_key"]},
            attrs={
                "code": office["code"],
                "is_headquarters": office["is_headquarters"],
                "is_active": office["is_active"],
                "position": office["position"],
                "phone_fixed": office["phone_fixed"],
                "phone_mobile": office["phone_mobile"],
                "email": office["email"],
            },
            entity="offices",
            stats=stats,
        )
        jobs.append(("office", instance.id, office["translations"]))

    for member in payload.team_members:
        instance = await _upsert(
            session,
            TeamMember,
            key={"source_key": member["source_key"]},
            attrs={
                "code": member["code"],
                "is_founder": member["is_founder"],
                "is_active": member["is_active"],
                "position": member["position"],
            },
            entity="team_members",
            stats=stats,
        )
        jobs.append(("team_member", instance.id, member["translations"]))

    for partner in payload.partners:
        instance = await _upsert(
            session,
            Partner,
            key={"source_key": partner["source_key"]},
            attrs={
                "name": partner["name"],
                "logo_media_id": partner["logo_media_id"],
                "website_url": partner["website_url"],
                "position": partner["position"],
                "is_active": partner["is_active"],
            },
            entity="partners",
            stats=stats,
        )
        jobs.append(("partner", instance.id, partner["translations"]))

    for setting in payload.settings:
        instance = await _upsert(
            session,
            SiteSetting,
            key={"group_key": setting["group_key"], "setting_key": setting["setting_key"]},
            attrs={"value": setting["value"], "is_translatable": setting["is_translatable"]},
            entity="site_settings",
            stats=stats,
        )
        jobs.append(("setting", instance.id, setting["translations"]))

    for publication in payload.publications:
        published = datetime.fromisoformat(publication["published_at"]).replace(tzinfo=UTC)
        instance = await _upsert(
            session,
            Publication,
            key={"source_key": publication["source_key"]},
            attrs={
                "category_id": category_ids[publication["category"]],
                "status": publication["status"],
                "published_at": published,
                # Décision Q-105/U1 : auteur = compte fondateur ; `author_name`
                # reste un texte d'affichage optionnel dans `data`.
                "author_id": user.id,
            },
            update_attrs={
                "category_id": category_ids[publication["category"]],
                "status": publication["status"],
                "published_at": published,
                "author_id": user.id,
            },
            entity="publications",
            stats=stats,
        )
        jobs.append(("publication", instance.id, publication["translations"]))

    for redirect in payload.redirects:
        await _upsert(
            session,
            Redirect,
            key={"old_path": redirect["old_path"]},
            attrs={
                "target_path": redirect["target_path"],
                "status_code": redirect["status_code"],
                "auto_generated": redirect["auto_generated"],
                "lang": redirect["lang"],
            },
            entity="redirects",
            stats=stats,
        )

    for entity_type, entity_id, translations in jobs:
        for code, spec in translations.items():
            await _upsert(
                session,
                EntityTranslation,
                key={"entity_type": entity_type, "entity_id": entity_id, "lang": code},
                attrs={
                    "slug": spec["slug"],
                    "status": spec["status"],
                    "data": spec["data"],
                },
                entity="entity_translations",
                stats=stats,
            )

    return stats
