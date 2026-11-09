"""Conformité des endpoints publics au contrat — Schemathesis.

Les cas sont générés depuis le contrat **servi** (`/openapi.json`, identique à
`openapi.yaml`) puis exécutés contre l'application ASGI : chaque réponse est
validée contre les schémas déclarés (`ServicesTree`, `Family`, `Sector`,
`PublicationSummary`, `PageDetail`, `PublicSettings`, `SearchHit`…).

Deux écarts de contrat connus sont neutralisés pour que le test reste utile
tant que la PR de contrat unique n'est pas fusionnée :

- `lang` est forcé sur `fr` : le contrat ne déclare pas le 422 `UNKNOWN_LANG`
  d'une langue inconnue ou inactive ;
- `cursor` est forcé sur la première page : le contrat ne déclare pas le 422
  `VALIDATION_ERROR` d'un curseur invalide.

Sans PostgreSQL, le module entier saute (skip), comme les autres tests d'intégration.
"""

from __future__ import annotations

import socket
from typing import Any

import pytest
from sqlalchemy.engine import make_url

from app.core.config import get_settings
from app.main import create_app

try:
    __import__("schemathesis")
except ImportError:  # pragma: no cover — dépendance native absente ou bloquée
    # `importorskip` remonte une `ImportError` interne (DLL) au lieu de sauter.
    pytest.skip("schemathesis non importable sur cette machine", allow_module_level=True)

from schemathesis import GenerationMode  # noqa: E402
from schemathesis.openapi import from_asgi  # noqa: E402


def _database_reachable() -> bool:
    """Test TCP rapide : évite de charger l'ASGI quand la base est absente."""
    url = make_url(get_settings().database_url)
    host = url.host or "localhost"
    port = url.port or 5432
    try:
        with socket.create_connection((host, port), timeout=1.0):
            return True
    except OSError:
        return False


if not _database_reachable():
    pytest.skip(
        "PostgreSQL injoignable — 'docker compose up -d db' puis 'alembic upgrade head'",
        allow_module_level=True,
    )


schema = from_asgi("/openapi.json", create_app())
# Uniquement les opérations publiques déjà implémentées, en mode positif
# (les entrées invalides relèvent de tests dédiés : le contrat ne documente
# pas encore leurs 422).
schema = schema.include(tag_regex="^(public-content|public-search)$")
schema.config.generation.update(max_examples=5, modes=[GenerationMode.POSITIVE])


@schema.hook("map_query")
def _stable_query(context: Any, query: dict[str, Any]) -> dict[str, Any]:
    """Fige `lang` et `cursor` sur des valeurs couvertes par le contrat."""
    if "lang" in query:
        query["lang"] = "fr"
    if "cursor" in query:
        query["cursor"] = "MA"  # base64url de « 0 » : première page
    return query


@schema.parametrize()
def test_public_endpoints_follow_contract(case: Any) -> None:
    """Chaque réponse publique est conforme au schéma du contrat."""
    case.call_and_validate()
