"""Modèles SQLAlchemy 2.0 (colonnes typées `Mapped` / `mapped_column`).

Le dictionnaire de données faisant foi est `Analyse/modelisation/docs/06-donnees.md`.
Chaque table respecte les règles transverses : PK `id UUID` (généré par
l'application), `created_at`/`updated_at` UTC, nommage `snake_case`, FK suffixées
`_id`, index `ix_<table>_<col>`, contraintes `ck_`/`uq_`.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base commune à toutes les tables du CMS."""


def new_uuid() -> uuid.UUID:
    """UUIDv4 généré côté application (jamais par la base — §0)."""
    return uuid.uuid4()


class UUIDPk:
    """Mixin : colonne `id UUID` PK générée par l'application."""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=new_uuid,
    )


class Timestamped:
    """Mixin : `created_at` / `updated_at` en UTC, toujours renseignés (§0)."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


def jsonb_default_empty() -> dict[str, Any]:
    """Valeur par défaut `{}` pour les colonnes JSONB de contenu."""
    return {}
