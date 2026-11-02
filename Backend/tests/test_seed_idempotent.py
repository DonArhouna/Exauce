"""Tests d'idempotence du seed — doc 06 §6.2 (re-execution sans effet).

Deux niveaux :
- test de payload (sans base) : sans `--with-demo`, aucune publication ;
- tests d'intégration (base dev) : deux exécutions en succession dans la
  même transaction (rejouée à la sortie) donnent 0 création / 0 mise à jour
  et des IDs strictement identiques ; `production=True` après `with_demo`
  ne crée aucune publication et ne supprime pas celles déjà présentes.

Prérequis : `docker compose up -d db` puis `alembic upgrade head`. Sans base
joignable, les tests d'intégration sont ignorés (skip).
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.config import get_settings
from app.models.content import ContentNode, Page, PageSection, Publication
from app.models.i18n import EntityTranslation
from app.seed import SeedStats, build_payload, run_seed


def test_payload_without_demo_has_no_publications() -> None:
    """Mode production : le payload ne contient aucune publication (Q-104)."""
    assert build_payload(with_demo=False).publications == []
    assert len(build_payload(with_demo=True).publications) == 3


async def test_demo_and_production_are_exclusive() -> None:
    """`--with-demo` et `--production` sont mutuellement exclusifs (Q-104)."""
    with pytest.raises(ValueError):
        # session=None : le garde-fou est le tout premier calcul de run_seed.
        await run_seed(None, with_demo=True, production=True)  # type: ignore[arg-type]


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


async def _snapshot(session: AsyncSession) -> dict[str, Any]:
    """IDs + comptes de toutes les tables semées (comparaison entre passes)."""
    counts: dict[str, int] = {}
    for name, model in (
        ("nodes", ContentNode),
        ("pages", Page),
        ("sections", PageSection),
        ("publications", Publication),
        ("translations", EntityTranslation),
    ):
        stmt = select(func.count()).select_from(model)
        counts[name] = int((await session.execute(stmt)).scalar_one())
    ids = {
        "node": sorted(
            str(uid) for uid in (await session.execute(select(ContentNode.id))).scalars()
        ),
        "page": sorted(str(uid) for uid in (await session.execute(select(Page.id))).scalars()),
        "translation": sorted(
            f"{row.entity_type}:{row.entity_id}:{row.lang}"
            for row in ((await session.execute(select(EntityTranslation))).scalars().all())
        ),
    }
    return {"counts": counts, "ids": ids}


def _is_zero(stats: SeedStats) -> bool:
    return stats.total_created == 0 and sum(stats.updated.values()) == 0


async def test_second_run_is_a_noop(session: AsyncSession) -> None:
    """Deuxième exécution : 0 création, 0 mise à jour, IDs identiques."""
    first = await run_seed(session, with_demo=True)
    before = await _snapshot(session)

    second = await run_seed(session, with_demo=True)
    after = await _snapshot(session)

    assert _is_zero(second), f"2e passe non nulle : {second}"
    assert after == before, "la 2e passe a change des IDs ou des comptes"
    assert first.total_created >= 0  # 1re passe : creations ou rien (base deja semee)


async def test_rerun_restores_modified_rows(session: AsyncSession) -> None:
    """Une ligne modifiée à la main est réalignée par le seed (updated=1)."""
    await run_seed(session, with_demo=True)
    page = (await session.execute(select(Page).where(Page.page_key == "services"))).scalar_one()
    page.nav_position = 99
    await session.flush()

    stats = await run_seed(session, with_demo=True)
    assert stats.updated.get("pages") == 1
    assert page.nav_position == 1


async def test_production_run_inserts_no_publications(session: AsyncSession) -> None:
    """`production=True` après `with_demo` : 0 publication créée/supprimée."""
    await run_seed(session, with_demo=True)
    before = int(
        (await session.execute(select(func.count()).select_from(Publication))).scalar_one()
    )
    assert before == 3

    stats = await run_seed(session, production=True)
    after = int((await session.execute(select(func.count()).select_from(Publication))).scalar_one())
    assert after == before == 3
    assert "publications" not in stats.created
    assert "publications" not in stats.updated
