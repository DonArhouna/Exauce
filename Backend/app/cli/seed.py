"""CLI du seed idempotent (doc 06 §6.2).

Usage : python -m app.cli.seed [--with-demo | --production]
        [--reconcile-permissions]
"""

from __future__ import annotations

import argparse
import asyncio

from app.core.db import get_session_factory
from app.seed import SeedStats, run_seed


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m app.cli.seed",
        description="Seed idempotent (doc 06 section 6.2) - upserts par source_key.",
    )
    group = parser.add_mutually_exclusive_group()
    group.add_argument(
        "--with-demo",
        action="store_true",
        help="inclut les 3 publications Exemple (dev/staging, Q-104)",
    )
    group.add_argument(
        "--production",
        action="store_true",
        help="seed de production : aucune donnee de demo",
    )
    parser.add_argument(
        "--reconcile-permissions",
        action="store_true",
        help=(
            "retire les liens role_permissions des 6 roles semes absents du "
            "payload (affiche chaque retrait ; les autres roles ne sont jamais touches)"
        ),
    )
    return parser


async def _run(with_demo: bool, production: bool, reconcile_permissions: bool) -> SeedStats:
    factory = get_session_factory()
    async with factory() as session:
        stats = await run_seed(
            session,
            with_demo=with_demo,
            production=production,
            reconcile_permissions=reconcile_permissions,
        )
        await session.commit()
    return stats


def main(argv: list[str] | None = None) -> int:
    """Insere ou aligne le seed, puis committe. Re-execution sans effet."""
    args = _parser().parse_args(argv)
    stats = asyncio.run(_run(args.with_demo, args.production, args.reconcile_permissions))
    for entity in sorted(set(stats.created) | set(stats.updated) | set(stats.deleted)):
        created = stats.created.get(entity, 0)
        updated = stats.updated.get(entity, 0)
        deleted = stats.deleted.get(entity, 0)
        print(f"{entity}: created={created} updated={updated} deleted={deleted}")
    print(f"TOTAL created={stats.total_created}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
