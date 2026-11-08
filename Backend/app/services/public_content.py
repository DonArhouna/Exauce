"""Lecture publique du contenu — EF-101..108, EF-201..204 (doc 08 §2).

Toutes les fonctions renvoient des structures prêtes pour JSON (dicts), avec
le repli de langue explicite `is_fallback` : la traduction demandée est
utilisée si elle existe et est publiée, sinon la langue par défaut.

Aucune écriture : ces helpers ne font que lire les tables de contenu.
"""

from __future__ import annotations

import base64
import uuid
from collections.abc import Sequence
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApiError
from app.models.content import (
    Category,
    ContentNode,
    InterventionType,
    Page,
    PageSection,
    Publication,
    Sector,
)
from app.models.i18n import EntityTranslation, Language
from app.models.site import Office, SiteSetting, TeamMember

DEFAULT_LANG = "fr"
SEARCH_LIMIT = 12


# ------------------------------------------------------------------ langues ---


async def resolve_lang(session: AsyncSession, lang: str | None) -> tuple[str, str]:
    """(langue demandée, langue par défaut) ; `UNKNOWN_LANG` si inactive."""
    default = (
        await session.execute(select(Language.code).where(Language.is_default.is_(True)))
    ).scalar_one_or_none() or DEFAULT_LANG
    if lang is None:
        return default, default
    active = (
        await session.execute(
            select(Language.code).where(Language.code == lang, Language.is_active.is_(True))
        )
    ).scalar_one_or_none()
    if active is None:
        raise ApiError(422, "UNKNOWN_LANG", f"Langue inconnue ou inactive : {lang}.")
    return lang, default


async def active_languages(session: AsyncSession) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            select(Language).where(Language.is_active.is_(True)).order_by(Language.sort_order)
        )
    ).scalars()
    return [
        {
            "code": row.code,
            "label": row.label,
            "direction": row.direction,
            "is_default": row.is_default,
        }
        for row in rows
    ]


# --------------------------------------------------------------- traductions ---


async def _translations(
    session: AsyncSession,
    *,
    entity_type: str,
    entity_ids: Sequence[uuid.UUID],
    langs: Sequence[str],
) -> dict[uuid.UUID, dict[str, EntityTranslation]]:
    if not entity_ids:
        return {}
    rows = (
        await session.execute(
            select(EntityTranslation).where(
                EntityTranslation.entity_type == entity_type,
                EntityTranslation.entity_id.in_(entity_ids),
                EntityTranslation.lang.in_(langs),
            )
        )
    ).scalars()
    result: dict[uuid.UUID, dict[str, EntityTranslation]] = {}
    for row in rows:
        result.setdefault(row.entity_id, {})[row.lang] = row
    return result


def _pick(
    translations: dict[str, EntityTranslation],
    lang: str,
    default_lang: str,
) -> tuple[EntityTranslation | None, bool]:
    """Traduction demandée (publiée) ou repli sur la langue par défaut."""
    chosen = translations.get(lang)
    if chosen is not None and chosen.status == "published":
        return chosen, False
    fallback = translations.get(default_lang)
    if fallback is not None:
        return fallback, True
    return chosen, chosen is not None


def _localized(translation: EntityTranslation | None, key: str, fallback: bool) -> dict[str, Any]:
    value = "" if translation is None else str(translation.data.get(key, ""))
    return {"value": value, "is_fallback": fallback}


def _text(translation: EntityTranslation | None, key: str, default: str = "") -> str:
    if translation is None:
        return default
    value = translation.data.get(key)
    return str(value) if value is not None else default


def _slug(translation: EntityTranslation | None) -> str:
    if translation is None or translation.slug is None:
        return ""
    return translation.slug


# ------------------------------------------------------------------- arbre ----


async def _nodes(
    session: AsyncSession, *, lang: str, default_lang: str
) -> tuple[list[dict[str, Any]], dict[uuid.UUID, dict[str, Any]]]:
    """Nœuds publiés (famille → domaine → groupe → prestation) et index par id."""
    rows = (
        await session.execute(
            select(ContentNode)
            .where(ContentNode.status == "published")
            .order_by(ContentNode.position)
        )
    ).scalars()
    nodes = list(rows)
    translations = await _translations(
        session,
        entity_type="node",
        entity_ids=[node.id for node in nodes],
        langs=(lang, default_lang),
    )

    by_id: dict[uuid.UUID, dict[str, Any]] = {}
    for node in nodes:
        chosen, is_fallback = _pick(translations.get(node.id, {}), lang, default_lang)
        by_id[node.id] = {
            "id": node.id,
            "node_type": node.node_type,
            "parent_id": node.parent_id,
            "position": node.position,
            "slug": _slug(chosen),
            "title": _text(chosen, "title"),
            "tagline": chosen.data.get("tagline") if chosen is not None else None,
            "intro": _text(chosen, "intro"),
            "is_fallback": is_fallback,
            "children": [],
        }

    roots: list[dict[str, Any]] = []
    for item in by_id.values():
        parent = by_id.get(item["parent_id"]) if item["parent_id"] is not None else None
        if parent is None:
            roots.append(item)
        else:
            parent["children"].append(item)
    return roots, by_id


def _prestation(node: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": node["id"],
        "slug": node["slug"],
        "title": node["title"],
        "is_fallback": node["is_fallback"],
    }


def _group(node: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": node["id"],
        "slug": node["slug"],
        "title": node["title"],
        "is_fallback": node["is_fallback"],
        "services": [_prestation(child) for child in node["children"]],
    }


def _domain(node: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": node["id"],
        "slug": node["slug"],
        "title": node["title"],
        "intro": node["intro"] or None,
        "is_fallback": node["is_fallback"],
        "groups": [_group(child) for child in node["children"]],
    }


def _family(node: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": node["id"],
        "slug": node["slug"],
        "title": node["title"],
        "tagline": node["tagline"] or None,
        "is_fallback": node["is_fallback"],
        "domains": [_domain(child) for child in node["children"]],
    }


async def services_tree(session: AsyncSession, *, lang: str, default_lang: str) -> dict[str, Any]:
    roots, _ = await _nodes(session, lang=lang, default_lang=default_lang)
    families = [_family(node) for node in roots if node["node_type"] == "family"]
    return {
        "lang": lang,
        "default_lang": default_lang,
        "alternate": {
            "fr": "/fr/services",
            "en": "/en/services",
        },
        "fallback": None,
        "families": families,
    }


async def _find_node(
    session: AsyncSession,
    *,
    slug: str,
    node_type: str,
    lang: str,
    default_lang: str,
) -> dict[str, Any]:
    _, by_id = await _nodes(session, lang=lang, default_lang=default_lang)
    for node in by_id.values():
        if node["node_type"] == node_type and node["slug"] == slug:
            return node
    raise ApiError(404, "CONTENT_NOT_FOUND", "Contenu introuvable.")


async def family_detail(
    session: AsyncSession, *, slug: str, lang: str, default_lang: str
) -> dict[str, Any]:
    node = await _find_node(
        session, slug=slug, node_type="family", lang=lang, default_lang=default_lang
    )
    return _family(node)


async def domain_detail(
    session: AsyncSession, *, slug: str, lang: str, default_lang: str
) -> dict[str, Any]:
    node = await _find_node(
        session, slug=slug, node_type="domain", lang=lang, default_lang=default_lang
    )
    parent = node["parent_id"]
    siblings = [
        item
        for item in (await _nodes(session, lang=lang, default_lang=default_lang))[1].values()
        if item["node_type"] == "domain" and item["parent_id"] == parent
    ]
    siblings.sort(key=lambda item: item["position"])
    index = next(
        (position for position, item in enumerate(siblings) if item["id"] == node["id"]), 0
    )
    previous = siblings[index - 1] if index > 0 else None
    following = siblings[index + 1] if index + 1 < len(siblings) else None
    return {
        "id": node["id"],
        "slug": node["slug"],
        "title": node["title"],
        "intro": {"value": node["intro"], "is_fallback": node["is_fallback"]},
        "prev": {"slug": previous["slug"], "title": previous["title"]} if previous else None,
        "next": {"slug": following["slug"], "title": following["title"]} if following else None,
        "groups": [_group(child) for child in node["children"]],
    }


# ------------------------------------------------------------------ secteurs --


async def sectors(session: AsyncSession, *, lang: str, default_lang: str) -> list[dict[str, Any]]:
    rows = (await session.execute(select(Sector).order_by(Sector.position))).scalars()
    items = list(rows)
    translations = await _translations(
        session,
        entity_type="sector",
        entity_ids=[item.id for item in items],
        langs=(lang, default_lang),
    )
    by_id: dict[uuid.UUID, dict[str, Any]] = {}
    for item in items:
        chosen, is_fallback = _pick(translations.get(item.id, {}), lang, default_lang)
        by_id[item.id] = {
            "id": item.id,
            "code": item.code,
            "kind": item.kind,
            "slug": _slug(chosen),
            "title": _text(chosen, "title"),
            "intro": _text(chosen, "intro") or None,
            "approved": item.approved,
            "subcategories": [],
        }
    roots: list[dict[str, Any]] = []
    for item in items:
        current = by_id[item.id]
        if item.parent_id is None:
            roots.append(current)
        elif item.parent_id in by_id:
            by_id[item.parent_id]["subcategories"].append(current)
    return roots


# ------------------------------------------------------------- interventions --


async def intervention_types(
    session: AsyncSession, *, lang: str, default_lang: str
) -> list[dict[str, Any]]:
    rows = (
        await session.execute(select(InterventionType).order_by(InterventionType.sort_order))
    ).scalars()
    items = list(rows)
    translations = await _translations(
        session,
        entity_type="interventiontype",
        entity_ids=[item.id for item in items],
        langs=(lang, default_lang),
    )
    result: list[dict[str, Any]] = []
    for item in items:
        chosen, _ = _pick(translations.get(item.id, {}), lang, default_lang)
        result.append(
            {
                "id": item.id,
                "code": item.code,
                "slug": _slug(chosen),
                "title": _text(chosen, "title"),
                "intro": _text(chosen, "intro"),
                "signature": _text(chosen, "signature"),
                "sort_order": item.sort_order,
            }
        )
    return result


# -------------------------------------------------------------------- bureau --


async def offices(session: AsyncSession, *, lang: str, default_lang: str) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            select(Office).where(Office.is_active.is_(True)).order_by(Office.position)
        )
    ).scalars()
    items = list(rows)
    translations = await _translations(
        session,
        entity_type="office",
        entity_ids=[item.id for item in items],
        langs=(lang, default_lang),
    )
    result: list[dict[str, Any]] = []
    for item in items:
        chosen, _ = _pick(translations.get(item.id, {}), lang, default_lang)
        address_lines = chosen.data.get("address_lines", []) if chosen is not None else []
        result.append(
            {
                "id": item.id,
                "code": item.code,
                "is_headquarters": item.is_headquarters,
                "is_active": item.is_active,
                "phone_fixed": item.phone_fixed,
                "phone_mobile": item.phone_mobile,
                "email": item.email,
                "map_url": item.map_url,
                "name": _text(chosen, "name"),
                "address_lines": address_lines,
                "city": _text(chosen, "city"),
            }
        )
    return result


# -------------------------------------------------------------------- équipe --


async def team(session: AsyncSession, *, lang: str, default_lang: str) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            select(TeamMember).where(TeamMember.is_active.is_(True)).order_by(TeamMember.position)
        )
    ).scalars()
    items = list(rows)
    translations = await _translations(
        session,
        entity_type="team_member",
        entity_ids=[item.id for item in items],
        langs=(lang, default_lang),
    )
    result: list[dict[str, Any]] = []
    for item in items:
        chosen, _ = _pick(translations.get(item.id, {}), lang, default_lang)
        result.append(
            {
                "id": item.id,
                "code": item.code,
                "is_founder": item.is_founder,
                "is_active": item.is_active,
                "full_name": _text(chosen, "full_name"),
                "role": _text(chosen, "role"),
                "bio": _text(chosen, "bio") or None,
                "photo_url": None,
                "email": item.email,
                "linkedin_url": item.linkedin_url,
            }
        )
    return result


# -------------------------------------------------------------- publications --


def _publication_rows() -> Any:
    stmt = (
        select(Publication, Category.code)
        .outerjoin(Category, Category.id == Publication.category_id)
        .where(Publication.status == "published")
    )
    is_demo = getattr(Publication, "is_demo", None)
    if is_demo is not None:
        stmt = stmt.where(is_demo.is_(False))
    return stmt.order_by(Publication.published_at.desc().nulls_last(), Publication.id)


async def _publication_translations(
    session: AsyncSession, publications: Sequence[Publication], langs: Sequence[str]
) -> dict[uuid.UUID, dict[str, EntityTranslation]]:
    return await _translations(
        session,
        entity_type="publication",
        entity_ids=[publication.id for publication in publications],
        langs=langs,
    )


def _publication_summary(
    publication: Publication,
    category_code: str | None,
    translation: EntityTranslation | None,
    is_fallback: bool,
) -> dict[str, Any]:
    return {
        "id": publication.id,
        "slug": _slug(translation),
        "title": _text(translation, "title"),
        "excerpt": _text(translation, "excerpt") or None,
        "category_code": category_code or "",
        "published_at": publication.published_at,
        "cover_url": None,
        "is_fallback": is_fallback,
    }


def _decode_cursor(cursor: str | None) -> int:
    if not cursor:
        return 0
    try:
        padded = cursor + "=" * (-len(cursor) % 4)
        return int(base64.urlsafe_b64decode(padded.encode()).decode())
    except (ValueError, UnicodeDecodeError) as exc:
        raise ApiError(422, "VALIDATION_ERROR", "Curseur invalide.") from exc


def _encode_cursor(offset: int) -> str:
    return base64.urlsafe_b64encode(str(offset).encode()).decode().rstrip("=")


async def publications(
    session: AsyncSession,
    *,
    lang: str,
    default_lang: str,
    cursor: str | None,
    limit: int,
    category: str | None,
) -> dict[str, Any]:
    offset = _decode_cursor(cursor)
    stmt = _publication_rows()
    if category is not None:
        stmt = stmt.where(Category.code == category)
    rows = list((await session.execute(stmt.offset(offset).limit(limit + 1))).all())

    has_more = len(rows) > limit
    rows = rows[:limit]
    entities = [row[0] for row in rows]
    translations = await _publication_translations(session, entities, (lang, default_lang))

    items: list[dict[str, Any]] = []
    for publication, category_code in rows:
        chosen, is_fallback = _pick(translations.get(publication.id, {}), lang, default_lang)
        if chosen is None:
            continue
        items.append(_publication_summary(publication, category_code, chosen, is_fallback))
    return {
        "items": items,
        "next_cursor": _encode_cursor(offset + limit) if has_more else None,
    }


async def publication_detail(
    session: AsyncSession, *, slug: str, lang: str, default_lang: str
) -> dict[str, Any]:
    rows = list((await session.execute(_publication_rows())).all())
    entities = [row[0] for row in rows]
    translations = await _publication_translations(session, entities, (lang, default_lang))

    for publication, category_code in rows:
        chosen, is_fallback = _pick(translations.get(publication.id, {}), lang, default_lang)
        if chosen is None or chosen.slug != slug:
            continue
        summary = _publication_summary(publication, category_code, chosen, is_fallback)
        summary["body"] = _localized(chosen, "body", is_fallback)
        summary["author_name"] = _text(chosen, "author_name") or None
        return summary
    raise ApiError(404, "CONTENT_NOT_FOUND", "Publication introuvable.")


# --------------------------------------------------------------------- pages --


async def page_detail(
    session: AsyncSession, *, key: str, lang: str, default_lang: str
) -> dict[str, Any]:
    page = (await session.execute(select(Page).where(Page.page_key == key))).scalar_one_or_none()
    if page is None:
        raise ApiError(404, "CONTENT_NOT_FOUND", "Page introuvable.")

    page_translations = await _translations(
        session,
        entity_type="page",
        entity_ids=[page.id],
        langs=(lang, default_lang),
    )
    title_translation, title_fallback = _pick(
        page_translations.get(page.id, {}), lang, default_lang
    )

    sections = list(
        (
            await session.execute(
                select(PageSection)
                .where(PageSection.page_id == page.id, PageSection.is_active.is_(True))
                .order_by(PageSection.position)
            )
        ).scalars()
    )
    section_translations = await _translations(
        session,
        entity_type="page_section",
        entity_ids=[section.id for section in sections],
        langs=(lang, default_lang),
    )
    rendered_sections: list[dict[str, Any]] = []
    for section in sections:
        chosen, _ = _pick(section_translations.get(section.id, {}), lang, default_lang)
        rendered_sections.append(
            {
                "id": section.id,
                "section_type": section.section_type,
                "source_key": section.source_key,
                "position": section.position,
                "is_active": section.is_active,
                "config": section.config,
                "data": {} if chosen is None else chosen.data,
            }
        )

    return {
        "id": page.id,
        "page_key": page.page_key,
        "template": page.template,
        "is_in_nav": page.is_in_nav,
        "nav_position": page.nav_position,
        "is_system": page.is_system,
        "status": page.status,
        "banners_pending": page.banners_pending,
        "title": {
            "value": _text(title_translation, "title"),
            "is_fallback": title_fallback,
        },
        "sections": rendered_sections,
    }


# ---------------------------------------------------------------- paramètres --


async def public_settings(session: AsyncSession, *, lang: str, default_lang: str) -> dict[str, Any]:
    settings = list((await session.execute(select(SiteSetting))).scalars())
    values: dict[tuple[str, str], Any] = {}
    for setting in settings:
        values[(setting.group_key, setting.setting_key)] = setting.value

    legal_name = values.get(("identity", "legal_name"), {})
    if isinstance(legal_name, dict):
        legal_name = legal_name.get("value", "")

    headquarters = (
        await session.execute(
            select(Office)
            .where(Office.is_active.is_(True), Office.is_headquarters.is_(True))
            .limit(1)
        )
    ).scalar_one_or_none()
    office_payload: dict[str, Any] = {}
    if headquarters is not None:
        translations = await _translations(
            session,
            entity_type="office",
            entity_ids=[headquarters.id],
            langs=(lang, default_lang),
        )
        chosen, _ = _pick(translations.get(headquarters.id, {}), lang, default_lang)
        lines = chosen.data.get("address_lines", []) if chosen is not None else []
        office_payload = {
            "email": headquarters.email or "",
            "phone_fixed": headquarters.phone_fixed or "",
            "phone_mobile": headquarters.phone_mobile or "",
            "city": _text(chosen, "city"),
            "address": ", ".join(str(line) for line in lines) if lines else None,
        }

    return {
        "legal_name": str(legal_name or ""),
        "tagline": "",
        "email": office_payload.get("email", ""),
        "phone_fixed": office_payload.get("phone_fixed", ""),
        "phone_mobile": office_payload.get("phone_mobile", ""),
        "city": office_payload.get("city", ""),
        "address": office_payload.get("address"),
        "socials": {},
        "seo_default": {},
    }


# ---------------------------------------------------------------- recherche ---


def _href(entity_type: str, lang: str, slug: str, parents: Sequence[str] = ()) -> str:
    if entity_type == "publication":
        return f"/{lang}/publications/{slug}"
    if entity_type == "sector":
        root = "secteurs" if lang == "fr" else "sectors"
        return f"/{lang}/{root}/{slug}"
    if entity_type == "interventiontype":
        return f"/{lang}/interventions/{slug}"
    if entity_type == "family":
        return f"/{lang}/services/{slug}"
    if entity_type == "domain":
        return f"/{lang}/services/{'/'.join([*parents, slug])}"
    return f"/{lang}/services/{'/'.join([*parents, slug])}"


async def search(
    session: AsyncSession, *, query: str, lang: str, default_lang: str
) -> dict[str, Any]:
    needle = query.casefold()
    hits: list[dict[str, Any]] = []

    roots, by_id = await _nodes(session, lang=lang, default_lang=default_lang)

    def parent_slugs(node: dict[str, Any]) -> list[str]:
        slugs: list[str] = []
        current = by_id.get(node["parent_id"]) if node["parent_id"] is not None else None
        while current is not None:
            slugs.insert(0, current["slug"])
            current = by_id.get(current["parent_id"]) if current["parent_id"] is not None else None
        return slugs

    for node in by_id.values():
        if needle in str(node["title"]).casefold():
            hits.append(
                {
                    "entity_type": node["node_type"],
                    "entity_id": node["id"],
                    "title": node["title"],
                    "slug": node["slug"],
                    "href": _href(node["node_type"], lang, node["slug"], parent_slugs(node)),
                    "rank": 1.0 if str(node["title"]).casefold() == needle else 0.5,
                    "is_fallback": node["is_fallback"],
                }
            )

    for sector in await sectors(session, lang=lang, default_lang=default_lang):
        stack = [sector]
        while stack:
            current = stack.pop()
            stack.extend(current["subcategories"])
            if needle in str(current["title"]).casefold():
                hits.append(
                    {
                        "entity_type": "sector",
                        "entity_id": current["id"],
                        "title": current["title"],
                        "slug": current["slug"],
                        "href": _href("sector", lang, current["slug"]),
                        "rank": 1.0 if str(current["title"]).casefold() == needle else 0.5,
                        "is_fallback": False,
                    }
                )

    for intervention in await intervention_types(session, lang=lang, default_lang=default_lang):
        if needle in str(intervention["title"]).casefold():
            hits.append(
                {
                    "entity_type": "interventiontype",
                    "entity_id": intervention["id"],
                    "title": intervention["title"],
                    "slug": intervention["slug"],
                    "href": _href("interventiontype", lang, intervention["slug"]),
                    "rank": 1.0 if str(intervention["title"]).casefold() == needle else 0.5,
                    "is_fallback": False,
                }
            )

    rows = list((await session.execute(_publication_rows())).all())
    entities = [row[0] for row in rows]
    translations = await _publication_translations(session, entities, (lang, default_lang))
    for publication, _category in rows:
        chosen, is_fallback = _pick(translations.get(publication.id, {}), lang, default_lang)
        title = _text(chosen, "title")
        if chosen is not None and needle in title.casefold():
            hits.append(
                {
                    "entity_type": "publication",
                    "entity_id": publication.id,
                    "title": title,
                    "slug": chosen.slug,
                    "href": _href("publication", lang, chosen.slug or ""),
                    "rank": 1.0 if title.casefold() == needle else 0.5,
                    "is_fallback": is_fallback,
                }
            )

    hits.sort(key=lambda hit: (-float(hit["rank"]), str(hit["title"])))
    return {
        "results": hits[:SEARCH_LIMIT],
        "message": "" if hits else "Aucun résultat.",
    }
