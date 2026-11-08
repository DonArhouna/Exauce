"""Invitation de bout en bout contre MailHog — validation étape 2, point 4.

Chaîne réelle : CLI `app.cli.invite` → SMTP MailHog → extraction du lien
signé dans l'e-mail → activation → réutilisation refusée (410) → expiration
refusée (410). Sautent si MailHog ou PostgreSQL est injoignable.
"""

from __future__ import annotations

import contextlib
import os
import quopri
import re
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path

import httpx
import pytest
from conftest import AUTH_PASSWORD
from fastapi.testclient import TestClient
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth import Invitation, User
from app.services.invitations import create_invitation

MAILHOG_API = "http://localhost:8025"
BACKEND_DIR = Path(__file__).resolve().parents[1]

TOKEN_RE = re.compile(r"token=([A-Za-z0-9_.\-]+)")


def _mailhog_messages() -> list[dict]:
    """Messages MailHog (API v2) ; lève si l'IHM est injoignable."""
    response = httpx.get(f"{MAILHOG_API}/api/v2/messages", timeout=3)
    response.raise_for_status()
    return list(response.json().get("items", []))


def _require_mailhog() -> None:
    try:
        _mailhog_messages()
    except (httpx.HTTPError, OSError) as exc:
        pytest.skip(
            f"MailHog injoignable ({exc.__class__.__name__}) : docker compose up -d mailhog"
        )


def _purge_mailhog() -> None:
    """Vide la boîte MailHog (best-effort) pour des tests déterministes."""
    with contextlib.suppress(httpx.HTTPError, OSError):
        httpx.delete(f"{MAILHOG_API}/api/v1/messages", timeout=3)


def _ids(messages: list[dict]) -> set[str]:
    return {str(item.get("ID")) for item in messages}


def _find_mail(messages: list[dict], email: str) -> str:
    """Corps **décodé** (quoted-printable) du message adressé à `email`."""
    for item in messages:
        blob = str(item)
        if email in blob and "token=" in blob:
            raw = str(item.get("Content", {}).get("Body", "")).encode("utf-8", "replace")
            # CTE quoted-printable : '=3D' pour '=', '=\r\n' pour les retours doux.
            return quopri.decodestring(raw).decode("utf-8", "replace")
    raise AssertionError(f"aucun e-mail MailHog pour {email}")


def _run_cli(*args: str) -> subprocess.CompletedProcess[str]:
    env = dict(os.environ, PYTHONIOENCODING="utf-8")
    return subprocess.run(  # noqa: S603 — commande fixe, sans shell
        [sys.executable, "-m", "app.cli.invite", *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        cwd=BACKEND_DIR,
        env=env,
        timeout=60,
        check=False,
    )


# ------------------------------------------------------------------- envoi ----


async def test_cli_invitation_mail_activation_reuse(client: TestClient, auth_env) -> None:  # noqa: ANN001
    """CLI → MailHog → lien signé → activation → réutilisation refusée (410)."""
    _require_mailhog()
    email = "auth-activate@exauceac.com"
    _purge_mailhog()

    result = _run_cli(email)
    assert result.returncode == 0, result.stderr
    assert "jeton :" in result.stdout

    mail = _find_mail(_mailhog_messages(), email)
    match = TOKEN_RE.search(mail)
    assert match, "l'e-mail ne porte pas de lien signé token=..."
    token = match.group(1)
    assert "/admin/activate?token=" in mail

    ok = client.post(
        "/api/v1/admin/auth/activate", json={"token": token, "password": AUTH_PASSWORD}
    )
    assert ok.status_code == 200
    assert ok.json()["status"] == "authenticated"
    assert ok.json()["user"]["must_reset_password"] is False

    reused = client.post(
        "/api/v1/admin/auth/activate", json={"token": token, "password": AUTH_PASSWORD}
    )
    assert reused.status_code == 410
    assert reused.json()["code"] == "TOKEN_EXPIRED"


async def test_invitation_expiration_is_410(client: TestClient, auth_env) -> None:  # noqa: ANN001
    """Invitation périmée : activation refusée (410), jamais de session."""
    session: AsyncSession = auth_env["session"]
    user = (
        await session.execute(select(User).where(User.email == "auth-activate@exauceac.com"))
    ).scalar_one()
    token = await create_invitation(session, user)
    await session.execute(
        update(Invitation)
        .where(Invitation.user_id == user.id)
        .values(expires_at=datetime(2000, 1, 1, tzinfo=UTC))
    )
    await session.commit()

    response = client.post(
        "/api/v1/admin/auth/activate", json={"token": token, "password": AUTH_PASSWORD}
    )
    assert response.status_code == 410
    assert response.json()["code"] == "TOKEN_EXPIRED"
    assert client.cookies.get("session_id") is None


# --------------------------------------------------------------- comptes démo --


async def test_cli_demo_refuses_production(monkeypatch) -> None:  # noqa: ANN001
    """`--demo` est catégoriquement refusé si l'environnement est production."""
    import app.cli.invite as cli_invite

    monkeypatch.setattr(
        cli_invite, "get_settings", lambda: type("S", (), {"is_production": True})()
    )
    assert await cli_invite._run_demo() == cli_invite.EXIT_REFUSED  # noqa: SLF001


async def test_cli_demo_sends_invitations(auth_env) -> None:  # noqa: ANN001
    """`--demo` invite les 5 comptes démo vers MailHog (dev uniquement)."""
    _require_mailhog()
    session: AsyncSession = auth_env["session"]
    demo_count = len(
        (await session.execute(select(User).where(User.email.like("demo-%@exauceac.com"))))
        .scalars()
        .all()
    )
    if demo_count == 0:
        pytest.skip("comptes demo absents : 'python -m app.cli.seed --with-demo' d'abord")

    import app.cli.invite as cli_invite

    before = _ids(_mailhog_messages())
    assert await cli_invite._run_demo() == cli_invite.EXIT_OK  # noqa: SLF001
    fresh = [m for m in _mailhog_messages() if str(m.get("ID")) not in before]

    mail = _find_mail(fresh, "demo-editor@exauceac.com")
    assert TOKEN_RE.search(mail), "l'e-mail du compte demo ne porte pas de jeton"
    assert "/admin/activate?token=" in mail
