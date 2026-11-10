"""Soumission du formulaire de contact — EF-301..303 (doc 04 SC-301..306, doc 08 §5).

`POST /contact` → 202 `{id, status: "new"}` dans l'ordre :

1. **rate limit** par IP (`rate_limit_contact_per_10min`, 5 / 10 min) →
   429 `RATE_LIMITED` + `Retry-After` ;
2. **anti-abus** (SC-303) : honeypot rempli ou `elapsed_ms` absent / < 3 s →
   202 de complaisance, **aucune écriture** ;
3. **idempotence** : même `Idempotency-Key` + même payload → rejoue la réponse
   (`X-Idempotent-Replayed: true`) ; payload différent ou requête en vol →
   409 `IDEMPOTENT_REPLAY_CONFLICT` ;
4. sinon : `leads` (statut `new`) + `outbox_emails` (notification au cabinet,
   EF-306) dans la même transaction.
"""

from __future__ import annotations

import hashlib
import json
import logging
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApiError
from app.core.ratelimit import contact_limiter
from app.models.i18n import Language
from app.models.idempotency import IdempotencyKey
from app.models.leads import Lead, OutboxEmail

logger = logging.getLogger(__name__)

#: Périmètre de la clé d'idempotence (contrainte `uq_idempotency_keys_scope_key`).
SCOPE = "contact"

#: Clé de template de l'e-mail de notification au cabinet (doc 07 §5).
TEMPLATE_KEY = "contact_cabinet"

#: La première réponse d'une clé est rejouée 24 h (doc 08 §5).
IDEMPOTENCY_TTL = timedelta(hours=24)

#: Délai minimal de rédaction (doc 09 §7) — sous ce seuil, réponse de complaisance.
MIN_ELAPSED_MS = 3000

_DEFAULT_LANG = "fr"


class ContactRequest(BaseModel):
    """Corps `ContactRequest` du contrat (champs requis : name, email, subject, message)."""

    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40)
    subject: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=5000)
    lang: str | None = Field(default=None, max_length=10)
    honeypot: str = Field(default="", max_length=200)
    elapsed_ms: int | None = Field(default=None, ge=0)


@dataclass(slots=True)
class ContactResult:
    """Corps 202 à renvoyer ; `replayed` déclenche l'en-tête `X-Idempotent-Replayed`."""

    body: dict[str, Any]
    replayed: bool = False


def is_suspect(payload: ContactRequest) -> bool:
    """True si la soumission ressemble à un bot (honeypot ou délai absent/trop court)."""
    if payload.honeypot.strip():
        return True
    return payload.elapsed_ms is None or payload.elapsed_ms < MIN_ELAPSED_MS


def _payload_hash(payload: ContactRequest) -> str:
    """SHA-256 du payload canonique — départage le 409 du replay (doc 08 §5)."""
    canonical = json.dumps(
        payload.model_dump(mode="json"), sort_keys=True, ensure_ascii=False, separators=(",", ":")
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


async def _resolve_lead_lang(session: AsyncSession, lang: str | None) -> str:
    """Langue du lead : code actif, sinon langue par défaut (jamais d'erreur 422 ici).

    Contrairement à `public_content.resolve_lang`, un code inconnu ne casse pas
    la soumission : la notification part en langue par défaut.
    """
    default = (
        await session.execute(select(Language.code).where(Language.is_default.is_(True)))
    ).scalar_one_or_none() or _DEFAULT_LANG
    if not lang:
        return default
    active = (
        await session.execute(
            select(Language.code).where(Language.code == lang, Language.is_active.is_(True))
        )
    ).scalar_one_or_none()
    return active or default


async def _reserve_key(
    session: AsyncSession, *, idempotency_key: str, request_hash: str
) -> tuple[IdempotencyKey, bool]:
    """Pose la ligne `idempotency_keys` (response_status NULL = requête en vol).

    Renvoie `(ligne, créée)`. Deux tentatives : si deux soumissions simultanées
    se disputent la contrainte `(scope, key)`, la seconde relit la ligne et suit
    le chemin replay/conflit.
    """
    for attempt in (0, 1):
        row = (
            await session.execute(
                select(IdempotencyKey).where(
                    IdempotencyKey.scope == SCOPE, IdempotencyKey.key == idempotency_key
                )
            )
        ).scalar_one_or_none()
        if row is not None:
            return row, False
        reserved = IdempotencyKey(
            key=idempotency_key,
            scope=SCOPE,
            request_hash=request_hash,
            response_status=None,
            response_body=None,
            expires_at=datetime.now(UTC) + IDEMPOTENCY_TTL,
        )
        session.add(reserved)
        try:
            await session.flush()
        except IntegrityError:
            await session.rollback()
            if attempt:
                raise
            continue
        return reserved, True
    raise AssertionError("inatteignable")  # pragma: no cover


async def submit_contact(
    session: AsyncSession,
    *,
    payload: ContactRequest,
    idempotency_key: str,
    client_key: str,
) -> ContactResult:
    """Enregistre une demande de contact (ou rejoue/répond en complaisance)."""
    retry = contact_limiter().retry_after(client_key)
    if retry is not None:
        seconds = max(1, int(retry) + 1)
        raise ApiError(
            429,
            "RATE_LIMITED",
            f"Trop de demandes, réessayez dans {seconds} secondes.",
            headers={"Retry-After": str(seconds)},
        )

    if is_suspect(payload):
        # SC-303 : réponse de complaisance, aucune ligne écrite (ni lead, ni clé).
        logger.warning(
            "contact rejeté (anti-abus)",
            extra={
                "client_key": client_key,
                "honeypot_filled": bool(payload.honeypot.strip()),
                "elapsed_ms": payload.elapsed_ms,
            },
        )
        return ContactResult(body={"id": str(uuid.uuid4()), "status": "new"})

    request_hash = _payload_hash(payload)
    row, created = await _reserve_key(
        session, idempotency_key=idempotency_key, request_hash=request_hash
    )
    if not created:
        if row.request_hash != request_hash:
            raise ApiError(
                409,
                "IDEMPOTENT_REPLAY_CONFLICT",
                "Cette clé d'idempotence a déjà servi pour un autre contenu.",
            )
        if row.response_status is not None:
            return ContactResult(body=dict(row.response_body or {}), replayed=True)
        raise ApiError(
            409,
            "IDEMPOTENT_REPLAY_CONFLICT",
            "Une requête identique est déjà en cours de traitement.",
        )

    lang = await _resolve_lead_lang(session, payload.lang)
    lead = Lead(
        name=payload.name,
        email=str(payload.email),
        phone=payload.phone,
        subject=payload.subject,
        message=payload.message,
        lang=lang,
        status="new",
    )
    session.add(lead)
    await session.flush()

    body = {"id": str(lead.id), "status": "new"}
    session.add(
        OutboxEmail(
            template_key=TEMPLATE_KEY,
            payload={
                "lead_id": body["id"],
                "name": payload.name,
                "email": str(payload.email),
                "phone": payload.phone,
                "subject": payload.subject,
                "message": payload.message,
            },
            lang=lang,
            status="pending",
        )
    )
    row.response_status = 202
    row.response_body = body
    await session.commit()
    logger.info("contact enregistré", extra={"lead_id": body["id"], "lang": lang})
    return ContactResult(body=body)
