"""Santé de l'API — tag `infra` (hors contrat applicatif, cf. openapi.yaml)."""

from __future__ import annotations

import asyncio
from typing import Annotated, Literal, cast

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app import __version__
from app.core.db import get_session

router = APIRouter(tags=["infra"])


class HealthStatus(BaseModel):
    """Réponse conforme au schéma `HealthStatus` du contrat."""

    status: Literal["ok"] = "ok"
    version: str = Field(default=__version__)
    db: Literal["up", "down"]


async def db_probe(session: Annotated[AsyncSession, Depends(get_session)]) -> Literal["up", "down"]:
    """Sonde PostgreSQL avec un budget de temps borné (healthcheck).

    Surchargeable en test (`dependency_overrides`) pour simuler une base
    injoignable sans réseau.
    """
    try:
        async with asyncio.timeout(2):
            await session.execute(text("SELECT 1"))
        return "up"
    except Exception:  # noqa: BLE001 - la healthcheck ne doit jamais lever
        return "down"


@router.get("/health", response_model=HealthStatus, summary="Santé de l'API")
async def health(db: Annotated[Literal["up", "down"], Depends(db_probe)]) -> HealthStatus:
    """Le processus est vivant ; l'état de la base est rapporté séparément.

    `200` même si `db=down` : on distingue un processus mort d'une base
    injoignable. La healthcheck Compose vérifie `"db": "up"`.
    """
    return HealthStatus(version=__version__, db=cast("Literal['up', 'down']", db))
