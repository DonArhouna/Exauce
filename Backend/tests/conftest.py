"""Fixtures de test : application fraîche, overrides de dépendances."""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.api.health import db_probe
from app.main import create_app


async def _probe_up() -> str:
    return "up"


async def _probe_down() -> str:
    return "down"


@pytest.fixture()
def client() -> Iterator[TestClient]:
    """Client de test synchrones ; la sonde de base répond `up` par défaut."""
    app = create_app()
    app.dependency_overrides[db_probe] = _probe_up
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def client_db_down() -> Iterator[TestClient]:
    """Client de test où PostgreSQL est injoignable."""
    app = create_app()
    app.dependency_overrides[db_probe] = _probe_down
    with TestClient(app) as test_client:
        yield test_client
