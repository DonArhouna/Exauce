"""Modèles multi-langue : langues, traductions, historisation, redirections, synonymes."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    SmallInteger,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, Timestamped, UUIDPk
from app.models.enums import EntityType, RedirectStatus, TranslationStatus


class Language(Base):
    """Langue supportée par le site — PK logique `code` BCP-47 (§2.1)."""

    __tablename__ = "languages"

    code: Mapped[str] = mapped_column(String(10), primary_key=True)
    label: Mapped[str] = mapped_column(String(60), nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    direction: Mapped[str] = mapped_column(String(3), nullable=False, default="ltr")
    sort_order: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)

    __table_args__ = (
        # §2.1 « 1 seul » / §7 : index partiel — un UNIQUE pleine colonne
        # interdirait deux langues non-défaut (cas à 3+ langues).
        Index(
            "uq_langues_default",
            "is_default",
            unique=True,
            postgresql_where=text("is_default"),
        ),
        CheckConstraint("direction IN ('ltr', 'rtl')", name="ck_langues_direction"),
    )


class EntityTranslation(UUIDPk, Timestamped, Base):
    """Traductions par entité — table pivot i18n (§2.1)."""

    __tablename__ = "entity_translations"

    entity_type: Mapped[str] = mapped_column(String(32), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    lang: Mapped[str] = mapped_column(
        String(10), ForeignKey("languages.code", ondelete="RESTRICT"), nullable=False
    )
    slug: Mapped[str | None] = mapped_column(String(180))
    og_media_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medias.id", ondelete="RESTRICT")
    )
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, default=TranslationStatus.MISSING.value
    )
    data: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        UniqueConstraint(
            "entity_type", "entity_id", "lang", name="uq_entity_translations_entity_lang"
        ),
        # Doc 06 §3 : UQ partiel, plusieurs NULL de slug autorisés.
        Index(
            "uq_entity_translations_slug",
            "entity_type",
            "lang",
            "slug",
            unique=True,
            postgresql_where=text("slug IS NOT NULL"),
        ),
        CheckConstraint(
            "status IN ('missing','draft','in_review','published','stale')",
            name="ck_entity_translations_status",
        ),
        CheckConstraint(
            f"entity_type IN ({', '.join(repr(e.value) for e in EntityType)})",
            name="ck_entity_translations_entity_type",
        ),
        Index("ix_entity_translations_entity_type_entity_id", "entity_type", "entity_id"),
        Index("ix_entity_translations_lang_status", "lang", "status"),
    )


class ContentVersion(UUIDPk, Base):
    """Historisation JSONB par entité/langue (§2.1) — restauration."""

    __tablename__ = "content_versions"

    entity_type: Mapped[str] = mapped_column(String(32), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    lang: Mapped[str] = mapped_column(
        String(10), ForeignKey("languages.code", ondelete="RESTRICT"), nullable=False
    )
    version: Mapped[int] = mapped_column(nullable=False)
    data: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint(
            "entity_type", "entity_id", "lang", "version", name="uq_content_versions_version"
        ),
        Index("ix_content_versions_entity_type_entity_id", "entity_type", "entity_id"),
    )


class Redirect(UUIDPk, Base):
    """Redirections 301/302 unifiées — ancien modèle fusionné (Q-103/A1)."""

    __tablename__ = "redirects"

    entity_type: Mapped[str | None] = mapped_column(String(32))
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    lang: Mapped[str | None] = mapped_column(
        String(10), ForeignKey("languages.code", ondelete="RESTRICT")
    )
    old_path: Mapped[str] = mapped_column(String(500), nullable=False)
    target_path: Mapped[str] = mapped_column(String(500), nullable=False)
    status_code: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=int(RedirectStatus.PERMANENT.value)
    )
    auto_generated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint("old_path", name="uq_redirects_old_path"),
        CheckConstraint("status_code IN (301, 302)", name="ck_redirects_status_code"),
        Index("ix_redirects_entity_type_entity_id", "entity_type", "entity_id"),
    )


class SearchSynonym(UUIDPk, Base):
    """Synonymes de recherche plein texte (EF-204)."""

    __tablename__ = "search_synonyms"

    lang: Mapped[str] = mapped_column(
        String(10), ForeignKey("languages.code", ondelete="RESTRICT"), nullable=False
    )
    term: Mapped[str] = mapped_column(String(120), nullable=False)
    synonym: Mapped[str] = mapped_column(String(120), nullable=False)

    __table_args__ = (
        UniqueConstraint("lang", "term", "synonym", name="uq_search_synonyms_lang_term_synonym"),
    )
