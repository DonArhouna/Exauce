"""Correlation id partagé entre la requête, les logs et les réponses d'erreur."""

from __future__ import annotations

from contextvars import ContextVar

_correlation_id: ContextVar[str] = ContextVar("correlation_id", default="-")


def set_correlation_id(value: str) -> None:
    _correlation_id.set(value)


def get_correlation_id() -> str:
    return _correlation_id.get()
