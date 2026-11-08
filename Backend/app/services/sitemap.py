"""Sitemap XML dynamique multi-langue — EF-701 / doc 13 §6.

Règles de sélection (doc 13 §6, mission Frontend 2026-11-07) :

- **pages** : toutes sauf `not_found` (page technique). `legal_notice` reste
  incluse même si elle est encore `draft` (Q-102), comme `client_area`
  (Q-103 ouverte) ;
- **services** : familles et domaines uniquement (pas les groupes ni les
  prestations), statut `published` ;
- **interventions** et **secteurs** : les lignes semées (2 et 3) ;
- **publications** : `status='published'` **uniquement**. Les 3 publications
  de démonstration sont `draft` : elles sont donc absentes. La colonne
  `is_demo` n'existe pas encore en base (elle est prévue par la migration
  0002) ; le filtre est activé automatiquement dès qu'elle existe.

Le flux reprend le format du `generate-sitemap.mjs` du Frontend : une entrée
`<url>` par paire logique FR/EN, `<loc>` sur la version FR et deux
`xhtml:link` croisés. Le comptage est documenté dans le doc 13 §6.
"""

from __future__ import annotations

import uuid
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from typing import Any
from xml.sax.saxutils import escape

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content import (
    ContentNode,
    InterventionType,
    Page,
    Publication,
    Sector,
)
from app.models.i18n import EntityTranslation

LANGS: tuple[str, str] = ("fr", "en")

#: Ordre canonique des pages dans le sitemap (celui du Frontend).
PAGE_ORDER: tuple[str, ...] = (
    "home",
    "services",
    "interventions",
    "sectors",
    "publications",
    "partners",
    "about",
    "legal_notice",
    "client_area",
    "contact",
)


@dataclass(frozen=True)
class SitemapUrl:
    """Paire logique d'URLs FR/EN (slug vide = racine de la langue)."""

    fr: str
    en: str | None = None


async def _slugs(
    session: AsyncSession,
    *,
    entity_type: str,
    entity_ids: Sequence[uuid.UUID],
    published_only: bool = False,
) -> dict[uuid.UUID, dict[str, str]]:
    """Slugs FR/EN par entité (`entity_translations`)."""
    if not entity_ids:
        return {}
    stmt = select(
        EntityTranslation.entity_id,
        EntityTranslation.lang,
        EntityTranslation.slug,
    ).where(
        EntityTranslation.entity_type == entity_type,
        EntityTranslation.entity_id.in_(entity_ids),
        EntityTranslation.lang.in_(LANGS),
        EntityTranslation.slug.is_not(None),
    )
    if published_only:
        stmt = stmt.where(EntityTranslation.status == "published")

    slugs: dict[uuid.UUID, dict[str, str]] = {}
    for entity_id, lang, slug in (await session.execute(stmt)).all():
        if slug is not None:
            slugs.setdefault(entity_id, {})[lang] = slug
    return slugs


def _join(prefix: str, slug: str) -> str:
    if not prefix:
        return slug
    return f"{prefix}/{slug}" if slug else prefix


def _pair(prefix: str, slugs: dict[str, str]) -> SitemapUrl | None:
    """Construit la paire FR/EN d'une entité ; `None` sans slug FR."""
    fr = slugs.get("fr")
    if fr is None:
        return None
    en = slugs.get("en")
    return SitemapUrl(
        fr=_join(prefix, fr),
        en=_join(prefix, en) if en is not None else None,
    )


async def _page_entries(session: AsyncSession) -> list[SitemapUrl]:
    rows = (
        await session.execute(select(Page.id, Page.page_key).where(Page.page_key != "not_found"))
    ).all()
    slugs = await _slugs(session, entity_type="page", entity_ids=[row.id for row in rows])
    by_key = {row.page_key: slugs.get(row.id, {}) for row in rows}

    entries: list[SitemapUrl] = []
    for page_key in PAGE_ORDER:
        pair = _pair("", by_key.get(page_key, {}))
        if pair is not None:
            entries.append(pair)
    return entries


async def _service_entries(session: AsyncSession) -> list[SitemapUrl]:
    rows = (
        await session.execute(
            select(
                ContentNode.id,
                ContentNode.node_type,
                ContentNode.parent_id,
                ContentNode.position,
            ).where(
                ContentNode.node_type.in_(("family", "domain")),
                ContentNode.status == "published",
            )
        )
    ).all()
    slugs = await _slugs(session, entity_type="node", entity_ids=[row.id for row in rows])

    def sort_key(row: Any) -> tuple[int, str]:
        fr = slugs.get(row.id, {}).get("fr", "")
        return (row.position, fr)

    families = sorted((row for row in rows if row.node_type == "family"), key=sort_key)

    entries: list[SitemapUrl] = []
    for family in families:
        family_slugs = slugs.get(family.id)
        if family_slugs is None:
            continue
        family_pair = _pair("services", family_slugs)
        if family_pair is None:
            continue
        entries.append(family_pair)

        domains = sorted((row for row in rows if row.parent_id == family.id), key=sort_key)
        for domain in domains:
            domain_slugs = slugs.get(domain.id)
            if domain_slugs is None or "fr" not in domain_slugs:
                continue
            en_path = None
            if "en" in family_slugs and "en" in domain_slugs:
                en_path = f"services/{family_slugs['en']}/{domain_slugs['en']}"
            entries.append(
                SitemapUrl(
                    fr=f"services/{family_slugs['fr']}/{domain_slugs['fr']}",
                    en=en_path,
                )
            )
    return entries


async def _intervention_entries(session: AsyncSession) -> list[SitemapUrl]:
    rows = (await session.execute(select(InterventionType.id, InterventionType.sort_order))).all()
    slugs = await _slugs(
        session, entity_type="interventiontype", entity_ids=[row.id for row in rows]
    )

    entries: list[SitemapUrl] = []
    for row in sorted(
        rows, key=lambda item: (item.sort_order, slugs.get(item.id, {}).get("fr", ""))
    ):
        pair = _pair("interventions", slugs.get(row.id, {}))
        if pair is not None:
            entries.append(pair)
    return entries


async def _sector_entries(session: AsyncSession) -> list[SitemapUrl]:
    rows = (
        await session.execute(select(Sector.id, Sector.position).where(Sector.kind == "sector"))
    ).all()
    slugs = await _slugs(session, entity_type="sector", entity_ids=[row.id for row in rows])

    entries: list[SitemapUrl] = []
    for row in sorted(rows, key=lambda item: (item.position, slugs.get(item.id, {}).get("fr", ""))):
        slugs_fr = slugs.get(row.id, {})
        fr = slugs_fr.get("fr")
        if fr is None:
            continue
        en = slugs_fr.get("en")
        entries.append(
            SitemapUrl(
                fr=f"secteurs/{fr}",
                en=f"sectors/{en}" if en is not None else None,
            )
        )
    return entries


def _published_publications() -> Any:
    """Publications publiées ; `is_demo` exclu dès que la colonne existe."""
    stmt = select(Publication.id, Publication.published_at).where(Publication.status == "published")
    is_demo = getattr(Publication, "is_demo", None)
    if is_demo is not None:
        stmt = stmt.where(is_demo.is_(False))
    return stmt


async def _publication_entries(session: AsyncSession) -> list[SitemapUrl]:
    rows = (
        await session.execute(
            _published_publications().order_by(
                Publication.published_at.desc().nulls_last(), Publication.id
            )
        )
    ).all()
    slugs = await _slugs(
        session,
        entity_type="publication",
        entity_ids=[row.id for row in rows],
        published_only=True,
    )

    entries: list[SitemapUrl] = []
    for row in rows:
        pair = _pair("publications", slugs.get(row.id, {}))
        if pair is not None:
            entries.append(pair)
    return entries


async def collect_sitemap_entries(session: AsyncSession) -> list[SitemapUrl]:
    """Toutes les paires d'URLs indexables, dans l'ordre canonique."""
    entries: list[SitemapUrl] = []
    entries.extend(await _page_entries(session))
    entries.extend(await _service_entries(session))
    entries.extend(await _intervention_entries(session))
    entries.extend(await _sector_entries(session))
    entries.extend(await _publication_entries(session))
    return entries


def _absolute_url(base_url: str, lang: str, slug: str) -> str:
    root = base_url.rstrip("/")
    path = f"{root}/{lang}"
    cleaned = slug.strip("/")
    return f"{path}/{cleaned}" if cleaned else path


def _attribute(value: str) -> str:
    return escape(value, {'"': "&quot;"})


def build_sitemap_xml(entries: Iterable[SitemapUrl], *, base_url: str) -> str:
    """Sérialise les paires en `sitemap.xml` (format du Frontend)."""
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
        'xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ]
    for entry in entries:
        fr_url = _absolute_url(base_url, "fr", entry.fr)
        lines.append("  <url>")
        lines.append(f"    <loc>{escape(fr_url)}</loc>")
        lines.append(
            f'    <xhtml:link rel="alternate" hreflang="fr" href="{_attribute(fr_url)}" />'
        )
        if entry.en is not None:
            en_url = _absolute_url(base_url, "en", entry.en)
            lines.append(
                f'    <xhtml:link rel="alternate" hreflang="en" href="{_attribute(en_url)}" />'
            )
        lines.append("  </url>")
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


__all__ = [
    "PAGE_ORDER",
    "SitemapUrl",
    "build_sitemap_xml",
    "collect_sitemap_entries",
]
