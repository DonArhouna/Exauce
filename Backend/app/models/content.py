"""Modèles du contenu éditorial — Contexte 1 (§2.2).

Arborescence des services (ADR-002, liste d'adjacence), pages + sections typées,
secteurs, types d'intervention, catégories et publications.
"""

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
    Integer,
    SmallInteger,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, Timestamped, UUIDPk
from app.models.enums import WorkflowStatus


class ContentNode(UUIDPk, Timestamped, Base):
    """Nœud de l'arborescence des services — liste d'adjacence (ADR-002)."""

    __tablename__ = "content_nodes"

    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("content_nodes.id", ondelete="RESTRICT")
    )
    node_type: Mapped[str] = mapped_column(String(8), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    source_key: Mapped[str | None] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, default=WorkflowStatus.DRAFT.value
    )
    icon_media_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medias.id", ondelete="RESTRICT")
    )

    __table_args__ = (
        CheckConstraint(
            "node_type IN ('family','domain','group','service')",
            name="ck_content_nodes_node_type",
        ),
        CheckConstraint(
            "status IN ('draft','in_review','published','stale')",
            name="ck_content_nodes_status",
        ),
        Index("ix_content_nodes_parent_id_position", "parent_id", "position"),
        Index("ix_content_nodes_node_type_status", "node_type", "status"),
        Index(
            "uq_content_nodes_source_key",
            "source_key",
            unique=True,
            postgresql_where=text("source_key IS NOT NULL"),
        ),
    )


class Page(UUIDPk, Timestamped, Base):
    """Page du site — registre fermé de 10 `page_key` (§2.2)."""

    __tablename__ = "pages"

    page_key: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    template: Mapped[str] = mapped_column(String(20), nullable=False)
    source_key: Mapped[str | None] = mapped_column(String(60))
    is_in_nav: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    nav_position: Mapped[int | None] = mapped_column(SmallInteger)
    is_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, default=WorkflowStatus.DRAFT.value
    )
    banners_pending: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    __table_args__ = (
        CheckConstraint(
            "template IN ('home','standard','legal','contact','coming_soon')",
            name="ck_pages_template",
        ),
        CheckConstraint(
            "status IN ('draft','in_review','published','stale')",
            name="ck_pages_status",
        ),
        Index(
            "uq_pages_source_key",
            "source_key",
            unique=True,
            postgresql_where=text("source_key IS NOT NULL"),
        ),
    )


class SectionType(Base):
    """Catalogue des types de sections (PK logique `code`) — doc 16 §3.4."""

    __tablename__ = "section_types"

    code: Mapped[str] = mapped_column(String(40), primary_key=True)
    label: Mapped[str] = mapped_column(String(80), nullable=False)
    config_schema: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    translation_schema: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class PageSection(UUIDPk, Timestamped, Base):
    """Section typée d'une page — cible d'édition et d'idempotence (§2.2)."""

    __tablename__ = "page_sections"

    page_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pages.id", ondelete="CASCADE"), nullable=False
    )
    section_type: Mapped[str] = mapped_column(
        String(40), ForeignKey("section_types.code", ondelete="RESTRICT"), nullable=False
    )
    source_key: Mapped[str | None] = mapped_column(String(60))
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    config: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)

    __table_args__ = (
        UniqueConstraint("page_id", "position", name="uq_section_position"),
        Index(
            "uq_page_sections_page_id_source_key",
            "page_id",
            "source_key",
            unique=True,
            postgresql_where=text("source_key IS NOT NULL"),
        ),
        Index("ix_page_sections_page_id_is_active", "page_id", "is_active"),
    )


class InterventionType(UUIDPk, Base):
    """Type d'intervention (2 types éditables) — §2.2."""

    __tablename__ = "intervention_types"

    code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    source_key: Mapped[str | None] = mapped_column(String(40))
    sort_order: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)

    __table_args__ = (
        Index(
            "uq_intervention_types_source_key",
            "source_key",
            unique=True,
            postgresql_where=text("source_key IS NOT NULL"),
        ),
    )


class Sector(UUIDPk, Timestamped, Base):
    """Univers (sector) ou sous-catégorie (subcategory) — 3 secteurs + 9 sous-catégories."""

    __tablename__ = "sectors"

    kind: Mapped[str] = mapped_column(String(12), nullable=False)
    code: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    source_key: Mapped[str | None] = mapped_column(String(60))
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sectors.id", ondelete="RESTRICT")
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    approved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    __table_args__ = (
        CheckConstraint("kind IN ('sector','subcategory')", name="ck_sectors_kind"),
        Index(
            "uq_sectors_source_key",
            "source_key",
            unique=True,
            postgresql_where=text("source_key IS NOT NULL"),
        ),
    )


class Category(UUIDPk, Base):
    """Catégorie de publication — 6 catégories (§2.2)."""

    __tablename__ = "categories"

    code: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    position: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    source_key: Mapped[str | None] = mapped_column(String(60))

    __table_args__ = (
        Index(
            "uq_categories_source_key",
            "source_key",
            unique=True,
            postgresql_where=text("source_key IS NOT NULL"),
        ),
    )


class Publication(UUIDPk, Timestamped, Base):
    """Publication (article/actualité) — ordre décroissant par `published_at` (§2.2)."""

    __tablename__ = "publications"

    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="RESTRICT")
    )
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, default=WorkflowStatus.DRAFT.value
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cover_media_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medias.id", ondelete="RESTRICT")
    )
    author_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT")
    )
    source_key: Mapped[str | None] = mapped_column(String(60))

    __table_args__ = (
        CheckConstraint(
            "status IN ('draft','in_review','published','stale')",
            name="ck_publications_status",
        ),
        Index("ix_publications_status_published_at", "status", "published_at"),
        Index(
            "uq_publications_source_key",
            "source_key",
            unique=True,
            postgresql_where=text("source_key IS NOT NULL"),
        ),
    )
