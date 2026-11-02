"""CLI du seed : python -m app.cli.seed [--with-demo | --production]."""

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
    return parser


async def _run(with_demo: bool, production: bool) -> SeedStats:
    factory = get_session_factory()
    async with factory() as session:
        stats = await run_seed(session, with_demo=with_demo, production=production)
        await session.commit()
    return stats


def main(argv: list[str] | None = None) -> int:
    """Insere ou aligne le seed, puis committe. Re-execution sans effet."""
    args = _parser().parse_args(argv)
    stats = asyncio.run(_run(args.with_demo, args.production))
    for entity in sorted(set(stats.created) | set(stats.updated)):
        created = stats.created.get(entity, 0)
        updated = stats.updated.get(entity, 0)
        print(f"{entity}: created={created} updated={updated}")
    print(f"TOTAL created={stats.total_created}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
