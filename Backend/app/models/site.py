"""Modèles de paramètres, bureaux et équipe — Contexte 7 (§2.7)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, Timestamped, UUIDPk


class SiteSetting(UUIDPk, Base):
    """Paramètre du site — `value` JSONB, traduisibles via `entity_translations`."""

    __tablename__ = "site_settings"

    group_key: Mapped[str] = mapped_column(String(40), nullable=False)
    setting_key: Mapped[str] = mapped_column(String(40), nullable=False)
    value: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    is_translatable: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("group_key", "setting_key", name="uq_site_settings_group_key"),
    )


class Office(UUIDPk, Timestamped, Base):
    """Bureau — un seul siège garanti par index partiel (§2.7)."""

    __tablename__ = "offices"

    code: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    source_key: Mapped[str | None] = mapped_column(String(60))
    is_headquarters: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    phone_fixed: Mapped[str | None] = mapped_column(String(40))
    phone_mobile: Mapped[str | None] = mapped_column(String(40))
    email: Mapped[str | None] = mapped_column(String(255))
    map_url: Mapped[str | None] = mapped_column(String(500))
    media_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medias.id", ondelete="RESTRICT")
    )

    __table_args__ = (
        Index(
            "uq_offices_headquarters",
            "is_headquarters",
            unique=True,
            postgresql_where=text("is_headquarters"),
        ),
        Index(
            "uq_offices_source_key",
            "source_key",
            unique=True,
            postgresql_where=text("source_key IS NOT NULL"),
        ),
    )


class TeamMember(UUIDPk, Timestamped, Base):
    """Fiche équipe — une seule fiche fondateur (index partiel, §2.7)."""

    __tablename__ = "team_members"

    code: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    source_key: Mapped[str | None] = mapped_column(String(60))
    is_founder: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    media_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medias.id", ondelete="RESTRICT")
    )
    email: Mapped[str | None] = mapped_column(String(255))
    linkedin_url: Mapped[str | None] = mapped_column(String(500))

    __table_args__ = (
        Index(
            "uq_team_members_founder",
            "is_founder",
            unique=True,
            postgresql_where=text("is_founder"),
        ),
        Index(
            "uq_team_members_source_key",
            "source_key",
            unique=True,
            postgresql_where=text("source_key IS NOT NULL"),
        ),
    )
