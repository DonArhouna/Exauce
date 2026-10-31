"""Modèles médias — Contexte 6 (§2.6).

SHA-256 (`checksum`), variantes webp/jpg, et journal des références conditionnelles.
"""

from __future__ import annotations

import uuid

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    ForeignKey,
    Index,
    SmallInteger,
    String,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, Timestamped, UUIDPk


class Media(UUIDPk, Timestamped, Base):
    """Fichier média — `checksum` = SHA-256 (Sprint 3, magics bytes + ClamAV)."""

    __tablename__ = "medias"

    kind: Mapped[str] = mapped_column(String(12), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    mime: Mapped[str] = mapped_column(String(120), nullable=False)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    checksum: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(12), nullable=False, default="active")
    replaced_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medias.id", ondelete="RESTRICT")
    )
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT")
    )

    __table_args__ = (
        CheckConstraint("kind IN ('image','pdf','document')", name="ck_medias_kind"),
        CheckConstraint("status IN ('active','replaced','deleted')", name="ck_medias_status"),
    )


class MediaVariant(UUIDPk, Base):
    """Variante redimensionnée d'un média (webp/jpg)."""

    __tablename__ = "media_variants"

    media_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medias.id", ondelete="CASCADE"), nullable=False
    )
    width: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    format: Mapped[str] = mapped_column(String(8), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)

    __table_args__ = (
        CheckConstraint("format IN ('webp','jpg')", name="ck_media_variants_format"),
        Index("ix_media_variants_media_id", "media_id"),
    )


class MediaRef(UUIDPk, Base):
    """Référence d'un média par une entité — impose la suppression conditionnelle."""

    __tablename__ = "media_refs"

    media_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medias.id", ondelete="CASCADE"), nullable=False
    )
    ref_type: Mapped[str] = mapped_column(String(32), nullable=False)
    ref_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    ref_field: Mapped[str] = mapped_column(String(40), nullable=False)

    __table_args__ = (
        Index("ix_media_refs_media_id", "media_id"),
        Index("ix_media_refs_ref_type_ref_id", "ref_type", "ref_id"),
    )
