"""Middlewares transverses : correlation id, en-têtes de sécurité basiques."""

from __future__ import annotations

import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.context import set_correlation_id

logger = logging.getLogger(__name__)

_CORRELATION_HEADER = "X-Request-Id"


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Assigne un correlation id à chaque requête et le réémet en réponse.

    Le header entrant `X-Request-Id` est honoré s'il est présent (traçage
    depuis Nginx), sinon un UUID v4 est généré (page 08 §6, ENF-601).
    """

    async def dispatch(self, request: Request, call_next):  # noqa: ANN201, ANN001
        incoming = request.headers.get(_CORRELATION_HEADER, "")
        correlation_id = incoming if 0 < len(incoming) <= 64 else uuid.uuid4().hex
        set_correlation_id(correlation_id)
        request.state.correlation_id = correlation_id

        started = time.perf_counter()
        response: Response = await call_next(request)
        duration_ms = (time.perf_counter() - started) * 1000

        response.headers[_CORRELATION_HEADER] = correlation_id
        response.headers["Server-Timing"] = f"app;dur={duration_ms:.1f}"
        logger.info(
            "requête",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": round(duration_ms, 1),
            },
        )
        return response
