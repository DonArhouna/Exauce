"""Sitemap XML — EF-701 / doc 13 §6.

Deux niveaux :
- tests purs : sérialisation XML et paires FR/EN ;
- tests d'intégration (base dev, transaction rejouée) : seules les
  publications `published` sont retenues, les démos `draft` sont exclues.

Sans PostgreSQL, les tests d'intégration sautent (skip).
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from datetime import UTC, datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.config import get_settings
from app.models.content import Publication
from app.models.i18n import EntityTranslation
from app.seed import build_payload, run_seed
from app.services.sitemap import SitemapUrl, build_sitemap_xml, collect_sitemap_entries

# ------------------------------------------------------------------ unitaires --


def test_build_sitemap_xml_pairs_fr_and_en() -> None:
    """Une entrée `<url>` par paire, `loc` FR + `xhtml:link` croisés."""
    xml = build_sitemap_xml(
        [SitemapUrl(fr="", en=""), SitemapUrl(fr="partenaires", en="partners")],
        base_url="https://www.exauceac.com/",
    )

    assert xml.startswith('<?xml version="1.0" encoding="UTF-8"?>')
    assert 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' in xml
    assert xml.count("<url>") == 2
    assert "<loc>https://www.exauceac.com/fr</loc>" in xml
    assert 'hreflang="en" href="https://www.exauceac.com/en/partners"' in xml
    assert xml.endswith("</urlset>\n")


def test_build_sitemap_xml_escapes_attributes() -> None:
    """Les slugs sont échappés (XML bien formé)."""
    xml = build_sitemap_xml(
        [SitemapUrl(fr="a&b", en="a&b")],
        base_url="https://www.exauceac.com",
    )

    assert "<loc>https://www.exauceac.com/fr/a&amp;b</loc>" in xml
    assert 'href="https://www.exauceac.com/en/a&amp;b"' in xml
    assert "a&b" not in xml


def test_build_sitemap_xml_without_english() -> None:
    """Une entité sans traduction EN n'émet pas de `hreflang="en"`."""
    xml = build_sitemap_xml(
        [SitemapUrl(fr="article-fr", en=None)],
        base_url="https://www.exauceac.com",
    )

    assert '<xhtml:link rel="alternate" hreflang="fr"' in xml
    assert 'hreflang="en"' not in xml


# --------------------------------------------------------------- intégration --


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


async def _published_publication(session: AsyncSession, *, status: str) -> tuple[str, str]:
    """Crée une publication + traductions ; renvoie les slugs FR/EN."""
    suffix = uuid.uuid4().hex[:10]
    fr = f"sitemap-test-{suffix}"
    en = f"sitemap-test-en-{suffix}"
    publication = Publication(
        source_key=f"sitemap-test-{suffix}",
        status=status,
        published_at=datetime.now(UTC),
    )
    session.add(publication)
    await session.flush()
    for lang, slug in (("fr", fr), ("en", en)):
        session.add(
            EntityTranslation(
                entity_type="publication",
                entity_id=publication.id,
                lang=lang,
                slug=slug,
                status="published" if status == "published" else "draft",
                data={},
            )
        )
    await session.flush()
    return fr, en


async def test_sitemap_excludes_draft_demo_publications(session: AsyncSession) -> None:
    """Les 3 démos `draft` sont absentes ; pages et taxonomies sont présentes."""
    await run_seed(session, with_demo=True)
    payload = build_payload(with_demo=True)
    demo_paths = {
        f"publications/{publication['translations'][lang]['slug']}"
        for publication in payload.publications
        for lang in ("fr", "en")
    }

    entries = await collect_sitemap_entries(session)
    paths = {entry.fr for entry in entries}

    assert not paths & demo_paths, "publications de démonstration dans le sitemap"

    # 10 pages statiques (partners incluse, not_found exclue).
    assert SitemapUrl(fr="", en="") in entries
    assert SitemapUrl(fr="partenaires", en="partners") in entries
    assert SitemapUrl(fr="mentions-legales", en="legal-notice") in entries
    assert SitemapUrl(fr="espace-client", en="customer-area") in entries
    assert not any("not-found" in path or "404" in path for path in paths)

    # 2 familles + 10 domaines, 2 interventions, 3 secteurs.
    assert sum(path.startswith("services/") for path in paths) == 12
    assert sum(path.startswith("interventions/") for path in paths) == 2
    assert sum(path.startswith("secteurs/") for path in paths) == 3


async def test_sitemap_keeps_only_published_publications(
    session: AsyncSession,
) -> None:
    """Une publication `published` entre, une `draft` reste dehors."""
    await run_seed(session, with_demo=True)
    before = len(await collect_sitemap_entries(session))

    published_fr, published_en = await _published_publication(session, status="published")
    draft_fr, _ = await _published_publication(session, status="draft")

    entries = await collect_sitemap_entries(session)
    paths = {entry.fr for entry in entries}

    assert (
        SitemapUrl(fr=f"publications/{published_fr}", en=f"publications/{published_en}") in entries
    )
    assert f"publications/{draft_fr}" not in paths
    assert len(entries) == before + 1
