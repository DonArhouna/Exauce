"""Format d'erreur standard `application/problem+json` (RFC 9457 — page 08 §6).

Chaque erreur porte un `code` **stable** (jamais traduit, jamais renommé),
un `title`/`detail` traduit selon la langue négociée, et le
`correlation_id` de la requête pour corrélation avec les journaux.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.context import get_correlation_id

logger = logging.getLogger(__name__)

ERROR_BASE = "https://api.exauceac.com/errors"

#: Codification fermée — toute nouvelle valeur doit être ajoutée à `openapi.yaml`.
ERROR_CODES = frozenset(
    {
        "VALIDATION_ERROR",
        "UNKNOWN_LANG",
        "CONTENT_NOT_FOUND",
        "REDIRECTED",
        "UNAUTHENTICATED",
        "SESSION_EXPIRED",
        "MFA_REQUIRED",
        "FORBIDDEN",
        "CSRF_TOKEN_MISSING",
        "CSRF_TOKEN_MISMATCH",
        "NOT_PERMITTED_LANG",
        "INVALID_TRANSITION",
        "CONFLICT",
        "RATE_LIMITED",
        "IDEMPOTENT_REPLAY_CONFLICT",
        "UPLOAD_REJECTED",
        "IDOR_BLOCKED",
        "TOKEN_EXPIRED",
        "NOT_IMPLEMENTED",
        "SERVER_ERROR",
    }
)

#: Titres par langue (ADR-003 : la langue par défaut est le français).
_TITLES: dict[str, dict[str, str]] = {
    "VALIDATION_ERROR": {"fr": "Requête invalide", "en": "Invalid request"},
    "UNKNOWN_LANG": {"fr": "Langue inconnue ou inactive", "en": "Unknown or inactive language"},
    "CONTENT_NOT_FOUND": {"fr": "Contenu introuvable", "en": "Content not found"},
    "REDIRECTED": {"fr": "Contenu déplacé", "en": "Content moved"},
    "UNAUTHENTICATED": {"fr": "Authentification requise", "en": "Authentication required"},
    "SESSION_EXPIRED": {"fr": "Session expirée", "en": "Session expired"},
    "MFA_REQUIRED": {"fr": "Code de vérification requis", "en": "Verification code required"},
    "FORBIDDEN": {"fr": "Accès refusé", "en": "Access denied"},
    "CSRF_TOKEN_MISSING": {"fr": "Jeton CSRF manquant", "en": "CSRF token missing"},
    "CSRF_TOKEN_MISMATCH": {"fr": "Jeton CSRF invalide", "en": "Invalid CSRF token"},
    "NOT_PERMITTED_LANG": {"fr": "Langue non autorisée", "en": "Language not permitted"},
    "INVALID_TRANSITION": {
        "fr": "Transition de statut invalide",
        "en": "Invalid status transition",
    },
    "CONFLICT": {"fr": "Conflit d'état", "en": "State conflict"},
    "RATE_LIMITED": {"fr": "Trop de requêtes", "en": "Too many requests"},
    "IDEMPOTENT_REPLAY_CONFLICT": {
        "fr": "Clé d'idempotence réutilisée avec un autre contenu",
        "en": "Idempotency key reused with a different payload",
    },
    "UPLOAD_REJECTED": {"fr": "Fichier refusé", "en": "File rejected"},
    "IDOR_BLOCKED": {
        "fr": "Accès à une ressource d'un autre compte",
        "en": "Cross-account access blocked",
    },
    "TOKEN_EXPIRED": {"fr": "Jeton expiré", "en": "Expired token"},
    "NOT_IMPLEMENTED": {"fr": "Fonction non implémentée", "en": "Not implemented"},
    "SERVER_ERROR": {"fr": "Erreur interne", "en": "Internal error"},
}

_HTTP_STATUS_FALLBACK: dict[int, str] = {
    400: "VALIDATION_ERROR",
    401: "UNAUTHENTICATED",
    403: "FORBIDDEN",
    404: "CONTENT_NOT_FOUND",
    405: "VALIDATION_ERROR",
    409: "CONFLICT",
    410: "TOKEN_EXPIRED",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMITED",
    500: "SERVER_ERROR",
    501: "NOT_IMPLEMENTED",
    503: "SERVER_ERROR",
}


class ApiError(Exception):
    """Erreur applicative déjà traduite en code stable du catalogue."""

    def __init__(
        self,
        status_code: int,
        code: str,
        detail: str,
        *,
        errors: list[dict[str, str]] | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        if code not in ERROR_CODES:
            raise ValueError(f"Code d'erreur inconnu : {code}")
        super().__init__(detail)
        self.status_code = status_code
        self.code = code
        self.detail = detail
        self.errors = errors or []
        self.headers = headers or {}


def _request_lang(request: Request) -> str:
    lang = request.query_params.get("lang")
    if lang in {"fr", "en"}:
        return lang
    accept = request.headers.get("accept-language", "")
    if accept.lower().startswith("en"):
        return "en"
    return "fr"


def problem_payload(
    *,
    status_code: int,
    code: str,
    detail: str,
    lang: str = "fr",
    errors: list[dict[str, str]] | None = None,
    correlation_id: str | None = None,
) -> dict[str, Any]:
    """Construit le corps RFC 9457 (encodé sans erreur pour UUID/dates)."""
    titles = _TITLES.get(code, _TITLES["SERVER_ERROR"])
    payload: dict[str, Any] = {
        "type": f"{ERROR_BASE}/{code}",
        "title": titles.get(lang, titles["fr"]),
        "status": status_code,
        "code": code,
        "detail": detail,
        "correlation_id": correlation_id or get_correlation_id(),
    }
    if errors:
        payload["errors"] = errors
    return jsonable_encoder(payload)


def problem_response(
    request: Request,
    *,
    status_code: int,
    code: str,
    detail: str,
    errors: list[dict[str, str]] | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    payload = problem_payload(
        status_code=status_code,
        code=code,
        detail=detail,
        lang=_request_lang(request),
        errors=errors,
    )
    return JSONResponse(
        content=payload,
        status_code=status_code,
        media_type="application/problem+json",
        headers=headers,
    )


async def api_error_handler(request: Request, exc: ApiError) -> JSONResponse:
    return problem_response(
        request,
        status_code=exc.status_code,
        code=exc.code,
        detail=exc.detail,
        errors=exc.errors or None,
        headers=exc.headers,
    )


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = [
        {
            "field": ".".join(str(part) for part in err["loc"] if part != "body") or "body",
            "code": err["type"].upper(),
            "message": err["msg"],
        }
        for err in exc.errors()
    ]
    return problem_response(
        request,
        status_code=422,
        code="VALIDATION_ERROR",
        detail="Le contenu de la requête est invalide.",
        errors=errors,
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    code = _HTTP_STATUS_FALLBACK.get(exc.status_code, "SERVER_ERROR")
    detail = exc.detail if isinstance(exc.detail, str) else "Erreur"
    return problem_response(
        request,
        status_code=exc.status_code,
        code=code,
        detail=detail,
        headers=dict(getattr(exc, "headers", None) or {}),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Erreur non gérée", exc_info=exc)
    return problem_response(
        request,
        status_code=500,
        code="SERVER_ERROR",
        detail="Une erreur interne est survenue.",
    )
