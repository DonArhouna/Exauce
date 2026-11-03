"""CSRF double-envoi — ADR-009 / page 09 §2 (test obligatoire Sprint 1).

Prouve les deux refus `403` : en-tête absent (`CSRF_TOKEN_MISSING`) et en-tête
faux (`CSRF_TOKEN_MISMATCH`), la réussite avec le double jeton, et les routes
exemptées du contrat (`login`, `forgot`, `reset`, `activate`).
"""

from __future__ import annotations

from conftest import AUTH_PASSWORD
from fastapi.testclient import TestClient

EDITOR = "auth-editor@exauceac.com"
PREFIX = "/api/v1/admin"


def _problem_code(response) -> tuple[int, str, str]:  # noqa: ANN001
    body = response.json()
    assert response.headers["content-type"].startswith("application/problem+json")
    return response.status_code, body["code"], response.headers.get("content-type", "")


async def test_mutation_without_csrf_header_is_403(client: TestClient, auth_env) -> None:  # noqa: ANN001
    login = client.post(f"{PREFIX}/auth/login", json={"email": EDITOR, "password": AUTH_PASSWORD})
    assert login.status_code == 200

    out = client.post(f"{PREFIX}/auth/logout")  # aucun en-tête X-CSRF-Token
    status, code, _ = _problem_code(out)
    assert (status, code) == (403, "CSRF_TOKEN_MISSING")

    # La session reste valide : le refus est bien CSRF, pas d'authentification.
    assert client.get(f"{PREFIX}/auth/me").status_code == 200


async def test_mutation_with_forged_csrf_header_is_403(client: TestClient, auth_env) -> None:  # noqa: ANN001
    login = client.post(f"{PREFIX}/auth/login", json={"email": EDITOR, "password": AUTH_PASSWORD})
    assert login.status_code == 200

    out = client.post(f"{PREFIX}/auth/logout", headers={"X-CSRF-Token": "invalid-value"})
    status, code, _ = _problem_code(out)
    assert (status, code) == (403, "CSRF_TOKEN_MISMATCH")
    assert client.get(f"{PREFIX}/auth/me").status_code == 200


async def test_mutation_without_csrf_cookie_is_403(client: TestClient, auth_env) -> None:  # noqa: ANN001
    login = client.post(f"{PREFIX}/auth/login", json={"email": EDITOR, "password": AUTH_PASSWORD})
    assert login.status_code == 200
    header_value = client.cookies.get("csrf_token", "")
    client.cookies.delete("csrf_token")

    out = client.post(f"{PREFIX}/auth/logout", headers={"X-CSRF-Token": header_value})
    status, code, _ = _problem_code(out)
    assert (status, code) == (403, "CSRF_TOKEN_MISMATCH")


async def test_mutation_with_double_csrf_succeeds(client: TestClient, auth_env) -> None:  # noqa: ANN001
    login = client.post(f"{PREFIX}/auth/login", json={"email": EDITOR, "password": AUTH_PASSWORD})
    assert login.status_code == 200
    csrf = client.cookies.get("csrf_token", "")
    assert csrf

    out = client.post(f"{PREFIX}/auth/logout", headers={"X-CSRF-Token": csrf})
    assert out.status_code == 204
    assert client.get(f"{PREFIX}/auth/me").status_code == 401  # session révoquée


async def test_exempt_routes_do_not_require_csrf(client: TestClient, auth_env) -> None:  # noqa: ANN001
    # login : aucune session, aucun en-tête (contrat : csrfHeader absent).
    login = client.post(f"{PREFIX}/auth/login", json={"email": EDITOR, "password": AUTH_PASSWORD})
    assert login.status_code == 200
    client.cookies.clear()

    forgot = client.post(f"{PREFIX}/auth/password-forgot", json={"email": EDITOR})
    assert forgot.status_code == 202

    # activate : jeton invalide => 410 (et non 403 CSRF) => bien exemptée.
    activate = client.post(
        f"{PREFIX}/auth/activate", json={"token": "jeton-invalide", "password": AUTH_PASSWORD}
    )
    assert activate.status_code == 410

    reset = client.post(
        f"{PREFIX}/auth/password-reset", json={"token": "jeton-invalide", "password": AUTH_PASSWORD}
    )
    assert reset.status_code == 410


async def test_get_never_requires_csrf(client: TestClient, auth_env) -> None:  # noqa: ANN001
    login = client.post(f"{PREFIX}/auth/login", json={"email": EDITOR, "password": AUTH_PASSWORD})
    assert login.status_code == 200
    # GET sans en-tête : seule la session compte.
    assert client.get(f"{PREFIX}/auth/me").status_code == 200
