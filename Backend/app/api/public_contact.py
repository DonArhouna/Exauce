"""`POST /contact` — EF-301..303 (doc 08 §5, Q-106 option V1).

Lecture de `ContactRequest` + en-tête `Idempotency-Key` (UUID requis par le
contrat) ; la logique (rate limit, anti-abus, idempotence, lead + outbox) vit
dans `app.services.contact`.
"""

from __future__ import annotations

import ipaddress
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.services.contact import ContactRequest, submit_contact

router = APIRouter(tags=["public-contact"])

#: UUIDv4 généré côté client (contrat : `Idempotency-Key`, `format: uuid`).
_UUID_PATTERN = r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"

IdempotencyKeyHeader = Annotated[
    str,
    Header(alias="Idempotency-Key", pattern=_UUID_PATTERN),
]

#: Compartiment unique pour les clients sans IP exploitable (TestClient).
ANONYMOUS_BUCKET = "unidentified"


def client_key(request: Request) -> str:
    """Clé de rate limit : l'IP si elle est valide INET, sinon un compartiment unique."""
    host = request.client.host if request.client else None
    if host:
        try:
            ipaddress.ip_address(host)
        except ValueError:
            return ANONYMOUS_BUCKET
        return host
    return ANONYMOUS_BUCKET


@router.post("/contact", status_code=202, summary="Soumission du formulaire (EF-301..303)")
async def post_contact(
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_session)],
    payload: ContactRequest,
    idempotency_key: IdempotencyKeyHeader,
) -> dict[str, Any]:
    result = await submit_contact(
        db,
        payload=payload,
        idempotency_key=idempotency_key,
        client_key=client_key(request),
    )
    if result.replayed:
        response.headers["X-Idempotent-Replayed"] = "true"
    return result.body
