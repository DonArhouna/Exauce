"""Modèles d'authentification et RBAC — Contexte 3 (§2.3) + sécurité (page 09).

Argon2id pour les mots de passe, sessions par cookie, verrouillage exponentiel,
invitations signées (Q-105), consentements (conformité CDP).
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import INET, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, Timestamped, UUIDPk


class User(UUIDPk, Timestamped, Base):
    """Compte back-office — `password_hash` NULL pour le fondateur (Q-105/U1)."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str | None] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    mfa_secret: Mapped[str | None] = mapped_column(String(64))
    mfa_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    must_reset_password: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    default_lang: Mapped[str] = mapped_column(
        String(10), ForeignKey("languages.code", ondelete="RESTRICT"), nullable=False, default="fr"
    )


class Role(UUIDPk, Base):
    """Rôle — semés : super_admin, admin, editor, reviewer, crm, viewer."""

    __tablename__ = "roles"

    code: Mapped[str] = mapped_column(String(30), nullable=False, unique=True)
    label: Mapped[str] = mapped_column(String(60), nullable=False)


class Permission(UUIDPk, Base):
    """Permission (module, action, lang) — registre fermé (page 10)."""

    __tablename__ = "permissions"

    module: Mapped[str] = mapped_column(String(24), nullable=False)
    action: Mapped[str] = mapped_column(String(12), nullable=False)
    lang: Mapped[str | None] = mapped_column(
        String(10), ForeignKey("languages.code", ondelete="RESTRICT")
    )

    __table_args__ = (
        UniqueConstraint("module", "action", "lang", name="uq_permissions_module_action_lang"),
    )


class RolePermission(Base):
    """Table de jonction rôle ↔ permission — PK composite."""

    __tablename__ = "role_permissions"

    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True
    )
    permission_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True
    )


class UserRole(Base):
    """Table de jonction utilisateur ↔ rôle — PK composite."""

    __tablename__ = "user_roles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True
    )


class Session(UUIDPk, Base):
    """Session back-office — cookie HttpOnly, jeton haché (page 09 §2)."""

    __tablename__ = "sessions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ip: Mapped[str | None] = mapped_column(INET)
    user_agent: Mapped[str | None] = mapped_column(String(400))

    __table_args__ = (
        Index("ix_sessions_user_id", "user_id"),
        Index("ix_sessions_expires_at", "expires_at"),
    )


class LoginAttempt(UUIDPk, Base):
    """Tentative de connexion — base du verrouillage exponentiel (page 09 §2.2)."""

    __tablename__ = "login_attempts"

    email: Mapped[str] = mapped_column(String(255), nullable=False)
    succeeded: Mapped[bool] = mapped_column(Boolean, nullable=False)
    ip: Mapped[str | None] = mapped_column(INET)
    at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (Index("ix_login_attempts_email_at", "email", "at"),)


class Invitation(UUIDPk, Base):
    """Invitation signée (HMAC) — token à usage unique, TTL 7 jours (Q-105)."""

    __tablename__ = "invitations"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class Consent(UUIDPk, Base):
    """Consentement (CDP, loi 2008-12) — `subject_hash` pseudonymisé."""

    __tablename__ = "consents"

    subject_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    consent_type: Mapped[str] = mapped_column(String(20), nullable=False)
    granted: Mapped[bool] = mapped_column(Boolean, nullable=False)
    at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    source: Mapped[str | None] = mapped_column(String(20))

    __table_args__ = (
        CheckConstraint("consent_type IN ('cookies','forms')", name="ck_consents_consent_type"),
    )
