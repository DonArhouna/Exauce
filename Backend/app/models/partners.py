"""Partenaires — 11e page du site (mission Frontend 2026-11-07).

Entité éditoriale simple : nom, logo média, description par langue (via
`entity_translations`, `entity_type='partner'`), lien optionnel, ordre et
état actif. Les logos sont des médias (FK `RESTRICT`) ; aucun fichier n'est
semé en phase 1 (SVG refusé, voir note média).
"""

from __future__ import annotations

import uuid

from sqlalchemy import Boolean, ForeignKey, Index, SmallInteger, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, Timestamped, UUIDPk


class Partner(UUIDPk, Timestamped, Base):
    """Partenaire affiché sur `/partenaires` (FR) et `/partners` (EN)."""

    __tablename__ = "partners"

    source_key: Mapped[str | None] = mapped_column(String(60))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    logo_media_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medias.id", ondelete="RESTRICT")
    )
    website_url: Mapped[str | None] = mapped_column(String(500))
    position: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    __table_args__ = (
        Index(
            "uq_partners_source_key",
            "source_key",
            unique=True,
            postgresql_where=text("source_key IS NOT NULL"),
        ),
        Index("ix_partners_position", "position"),
    )


__all__ = ["Partner"]
