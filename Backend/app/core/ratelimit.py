"""Rate limiting en mémoire (fenêtre glissante) — doc 08 §5, doc 09 §7.

Borne assumée : le compteur est **par processus**. Deux workers uvicorn ne
partagent pas la fenêtre ; un comptage global exigerait Redis (hors v1).
Le même compteur sert ensuite à `password-forgot` avec une autre fenêtre.
"""

from __future__ import annotations

import time
from collections import defaultdict, deque

from app.core.config import get_settings

#: Nombre maximal de clés conservées avant purge des fenêtres expirées.
MAX_KEYS = 10_000


class SlidingWindowLimiter:
    """Fenêtre glissante : `limit` coups par `window_seconds` et par clé."""

    def __init__(self, limit: int, window_seconds: float) -> None:
        if limit < 1:
            raise ValueError("limit doit être >= 1")
        self.limit = limit
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def retry_after(self, key: str, *, now: float | None = None) -> float | None:
        """Consomme un jeton : `None` si la requête passe, sinon les secondes à attendre.

        Une requête refusée ne consomme pas de jeton (sinon un attaquant
        maintiendrait la victime bloquée indéfiniment).
        """
        current = time.monotonic() if now is None else now
        hits = self._hits[key]
        cutoff = current - self.window_seconds
        while hits and hits[0] <= cutoff:
            hits.popleft()
        if len(hits) >= self.limit:
            return max(0.0, hits[0] + self.window_seconds - current)
        hits.append(current)
        self._prune(current)
        return None

    def _prune(self, current: float) -> None:
        """Vide les clés dont la fenêtre a entièrement expiré (croissance bornée)."""
        if len(self._hits) <= MAX_KEYS:
            return
        for key, hits in list(self._hits.items()):
            if not hits or hits[-1] <= current - self.window_seconds:
                del self._hits[key]

    def reset(self) -> None:
        """Remise à zéro (tests)."""
        self._hits.clear()


_contact_limiter: SlidingWindowLimiter | None = None

#: Fenêtre de `POST /contact` : `rate_limit_contact_per_10min` / 10 minutes.
CONTACT_WINDOW_SECONDS = 600.0


def contact_limiter() -> SlidingWindowLimiter:
    """Compartiment `POST /contact` (5/10 min par IP, doc 08 §5)."""
    global _contact_limiter
    if _contact_limiter is None:
        _contact_limiter = SlidingWindowLimiter(
            get_settings().rate_limit_contact_per_10min, CONTACT_WINDOW_SECONDS
        )
    return _contact_limiter


def reset_contact_limiter() -> None:
    """Oublie le compteur contact (tests) ; il sera recréé à la prochaine requête."""
    global _contact_limiter
    _contact_limiter = None
