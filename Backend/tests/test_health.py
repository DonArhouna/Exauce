"""Tests de santé, d'erreurs RFC 9457 et de traçabilité des requêtes."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_health_declares_a_live_process(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["db"] == "up"
    assert body["version"]


def test_health_reports_a_down_database(client_db_down: TestClient) -> None:
    """Une base injoignable ne tue pas le processus : `db=down` reste en 200."""
    response = client_db_down.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["db"] == "down"


def test_unknown_route_returns_rfc7807_problem(client: TestClient) -> None:
    response = client.get("/api/v1/nimporte-quoi")

    assert response.status_code == 404
    assert response.headers["content-type"].startswith("application/problem+json")
    body = response.json()
    assert body["code"] == "CONTENT_NOT_FOUND"
    assert body["status"] == 404
    assert body["type"].endswith("/CONTENT_NOT_FOUND")
    assert body["correlation_id"]


def test_every_response_carries_a_correlation_id(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.headers["X-Request-Id"]


def test_incoming_correlation_id_is_propagated(client: TestClient) -> None:
    """Le header `X-Request-Id` entrant est honoré (traçage depuis Nginx)."""
    response = client.get("/api/v1/health", headers={"X-Request-Id": "trace-123"})

    assert response.headers["X-Request-Id"] == "trace-123"


def test_cors_is_credentialed_and_never_wildcard(client: TestClient) -> None:
    response = client.get(
        "/api/v1/health",
        headers={"Origin": "http://localhost:5173"},
    )

    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert response.headers["access-control-allow-credentials"] == "true"
    assert response.headers["access-control-allow-origin"] != "*"
