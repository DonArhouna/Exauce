"""Accès PostgreSQL (SQLAlchemy 2.0 async) et base déclarative."""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings


class Base(DeclarativeBase):
    """Base de toutes les tables (types annotés : Mapped / mapped_column)."""


_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    global _engine
    if _engine is None:
        settings = get_settings()
        _engine = create_async_engine(
            settings.database_url,
            pool_pre_ping=True,
            pool_size=settings.database_pool_size,
            max_overflow=settings.database_max_overflow,
        )
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            get_engine(),
            expire_on_commit=False,
            class_=AsyncSession,
        )
    return _session_factory


async def get_session() -> AsyncIterator[AsyncSession]:
    """Dépendance FastAPI : une session par requête, commit explicite côté service."""
    async with get_session_factory()() as session:
        yield session


async def dispose_engine() -> None:
    """Ferme le pool — appelée à l'arrêt de l'application."""
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None


def as_dict(obj: Any) -> dict[str, Any]:  # pragma: no cover - utilitaire
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
