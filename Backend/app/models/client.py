"""Comptes clients (v2, variante B) — Contexte 4 (§2.4).

Les modules `conversations` / `missions` (v2.2) restent désactivés (Q-005) :
seules les 4 tables documentées au §2.4 sont créées dès la migration 0001.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, Timestamped, UUIDPk


class ClientAccount(UUIDPk, Timestamped, Base):
    """Compte client (personne physique ou organisation) — §2.4."""

    __tablename__ = "client_accounts"

    is_organization: Mapped[bool] = mapped_column(Boolean, nullable=False)
    org_name: Mapped[str | None] = mapped_column(String(160))
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="invited")
    sector_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sectors.id", ondelete="RESTRICT")
    )
    preferred_lang: Mapped[str] = mapped_column(
        String(10),
        ForeignKey("languages.code", ondelete="RESTRICT"),
        nullable=False,
        default="fr",
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        CheckConstraint(
            "status IN ('invited','active','suspended','archived')",
            name="ck_client_accounts_status",
        ),
        Index("ix_client_accounts_sector_id", "sector_id"),
    )


class ClientUser(UUIDPk, Timestamped, Base):
    """Utilisateur d'un compte client (login de l'espace client) — §2.4."""

    __tablename__ = "client_users"

    account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("client_accounts.id", ondelete="RESTRICT"),
        nullable=False,
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    preferred_lang: Mapped[str] = mapped_column(
        String(10),
        ForeignKey("languages.code", ondelete="RESTRICT"),
        nullable=False,
        default="fr",
    )
    mfa_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    __table_args__ = (
        UniqueConstraint("account_id", "email", name="uq_client_users_account_id_email"),
        Index("ix_client_users_account_id", "account_id"),
    )


class ClientDocument(UUIDPk, Timestamped, Base):
    """Document déposé par un client (stockage objet) — §2.4."""

    __tablename__ = "client_documents"

    account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("client_accounts.id", ondelete="RESTRICT"),
        nullable=False,
    )
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    storage_key: Mapped[str] = mapped_column(String(255), nullable=False)
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mime: Mapped[str] = mapped_column(String(120), nullable=False)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        UniqueConstraint("storage_key", name="uq_client_documents_storage_key"),
        # §3 : unicité NON imposée (SC-404) — simple index de listage.
        Index("ix_client_documents_account_id_original_name", "account_id", "original_name"),
        Index("ix_client_documents_uploaded_by", "uploaded_by"),
    )


class ClientInvitation(UUIDPk, Timestamped, Base):
    """Invitation d'un client (token HMAC, TTL 7 j) — §2.4, page 09 §2.3."""

    __tablename__ = "client_invitations"

    account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("client_accounts.id", ondelete="RESTRICT"),
        nullable=False,
    )
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("token_hash", name="uq_client_invitations_token_hash"),
        Index("ix_client_invitations_account_id", "account_id"),
    )
