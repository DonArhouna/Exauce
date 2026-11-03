"""CSRF double-envoi — ADR-009 / page 09 §2 (test `tests/test_csrf.py`).

Toute requête mutante vers `/admin/**` doit présenter l'en-tête
`X-CSRF-Token` identique au cookie lisible `csrf_token`. Quatre routes sont
exemptées (contrat : `csrfHeader`) car non authentifiées encore :
`login`, `password-forgot`, `password-reset`, `activate`.
"""

from __future__ import annotations

import hmac

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import get_settings
from app.core.errors import problem_response

CSRF_HEADER = "X-CSRF-Token"
CSRF_COOKIE = "csrf_token"
SESSION_COOKIE = "session_id"

MUTATING_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})

#: Routes mutantes sans session (contrat : paramètre `csrfHeader`).
_CSRF_EXEMPT_SUFFIXES = (
    "/admin/auth/login",
    "/admin/auth/password-forgot",
    "/admin/auth/password-reset",
    "/admin/auth/activate",
)


def csrf_exempt(path: str) -> bool:
    """True si la route est l'une des 4 exemptées du contrat."""
    return any(path.endswith(suffix) for suffix in _CSRF_EXEMPT_SUFFIXES)


def csrf_enforced(method: str, path: str) -> bool:
    """True si la requête mutante `/admin/**` exige le double jeton."""
    prefix = get_settings().api_prefix
    return (
        method in MUTATING_METHODS and path.startswith(f"{prefix}/admin") and not csrf_exempt(path)
    )


class CsrfMiddleware(BaseHTTPMiddleware):
    """Refuse (403 RFC 9457) toute mutation admin sans double jeton valide."""

    async def dispatch(self, request: Request, call_next):  # noqa: ANN201, ANN001
        if csrf_enforced(request.method, request.url.path):
            header = request.headers.get(CSRF_HEADER, "")
            if not header:
                return problem_response(
                    request,
                    status_code=403,
                    code="CSRF_TOKEN_MISSING",
                    detail=f"L'en-tête {CSRF_HEADER} est obligatoire sur cette mutation.",
                )
            cookie = request.cookies.get(CSRF_COOKIE, "")
            if not cookie or not hmac.compare_digest(header, cookie):
                return problem_response(
                    request,
                    status_code=403,
                    code="CSRF_TOKEN_MISMATCH",
                    detail=f"L'en-tête {CSRF_HEADER} n'est pas celui de la session.",
                )
        response: Response = await call_next(request)
        return response
