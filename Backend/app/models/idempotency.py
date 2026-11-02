"""Clés d'idempotence des écritures publiques — doc 08 §5 (contrat)."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Index, SmallInteger, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, Timestamped, UUIDPk


class IdempotencyKey(UUIDPk, Timestamped, Base):
    """État d'une `Idempotency-Key` : rejoue la réponse ou signale le conflit.

    - même `(scope, key)` + même payload → rejoue la réponse stockée avec
      l'en-tête `X-Idempotent-Replayed: true` ;
    - même `(scope, key)` + payload différent → `409 IDEMPOTENT_REPLAY_CONFLICT` ;
    - `response_status` NULL → requête en cours (double soumission en vol).
    """

    __tablename__ = "idempotency_keys"

    key: Mapped[str] = mapped_column(String(128), nullable=False)
    scope: Mapped[str] = mapped_column(String(60), nullable=False)
    # SHA-256 hex du payload canonique — départage le 409 du replay.
    request_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    response_status: Mapped[int | None] = mapped_column(SmallInteger)
    response_body: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    __table_args__ = (
        UniqueConstraint("scope", "key", name="uq_idempotency_keys_scope_key"),
        # Purge des clés expirées (fenêtre de rejou définie par config).
        Index("ix_idempotency_keys_expires_at", "expires_at"),
    )
