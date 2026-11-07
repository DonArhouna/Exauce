"""Tests d'authentification — page 09 / contrat `/admin/auth/*`.

Couvre : succès, échec anti-énumération, verrouillage (429), MFA TOTP
(`mfa_required`, `mfa_enrollment_required` avec secret/QR/codes de secours,
code valide/invalid, code de secours), `/auth/me` avec permissions,
invitations (expirée / réutilisée / code TOTP),
réinitialisation avec révocation des sessions, changement de mot de passe.

Les comptes de test sont préparés par la fixture `auth_env` (conftest) sur la
base dev et purgés à la sortie ; sans PostgreSQL, les tests sautent (skip).
"""

from __future__ import annotations

from datetime import UTC, datetime

import pyotp
from conftest import (
    AUTH_PASSWORD,
    AUTH_UNKNOWN_EMAIL,
    AUTH_USERS,
    MFA_EMAIL,
    TOTP_SECRET,
)
from fastapi.testclient import TestClient
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import backup_codes
from app.models.auth import Invitation, Permission, RolePermission, User, UserRole
from app.services.invitations import create_invitation

EDITOR = "auth-editor@exauceac.com"
LOCKOUT = "auth-lockout@exauceac.com"
ADMIN = "auth-admin@exauceac.com"
FOUNDER = "auth-founder@exauceac.com"
ACTIVATE = "auth-activate@exauceac.com"
RESET = "auth-reset@exauceac.com"

#: Code issu d'un autre secret : jamais valide pour `TOTP_SECRET`.
_WRONG_TOTP = pyotp.TOTP("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ").now()


async def _user(session: AsyncSession, email: str) -> User:
    return (await session.execute(select(User).where(User.email == email))).scalar_one()


def _problem(response) -> dict[str, str]:  # noqa: ANN001
    body = response.json()
    assert response.headers["content-type"].startswith("application/problem+json")
    return {"code": body["code"], "detail": body["detail"], "status": str(body["status"])}


def _no_session_cookie(client: TestClient) -> bool:
    return client.cookies.get("session_id") is None


# ------------------------------------------------------------- connexion ----


async def test_login_success_sets_cookies(client: TestClient, auth_env) -> None:  # noqa: ANN001
    response = client.post(
        "/api/v1/admin/auth/login", json={"email": EDITOR, "password": AUTH_PASSWORD}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "authenticated"
    assert body["user"]["email"] == EDITOR
    assert body["user"]["roles"] == ["editor"]
    assert body["user"]["must_reset_password"] is False
    assert isinstance(body["user"]["permissions"], list)
    assert body["csrf_token"]

    cookies = response.headers.get_list("set-cookie")
    session_cookie = next(c for c in cookies if c.startswith("session_id="))
    csrf_cookie = next(c for c in cookies if c.startswith("csrf_token="))
    assert "HttpOnly" in session_cookie and "Path=/" in session_cookie
    assert "SameSite=lax" in session_cookie
    assert "HttpOnly" not in csrf_cookie  # lisible par le JS (double submit)
    assert "SameSite=lax" in csrf_cookie


async def test_login_failure_is_identical_for_unknown_email_and_bad_password(
    client: TestClient, auth_env
) -> None:  # noqa: ANN001
    unknown = client.post(
        "/api/v1/admin/auth/login", json={"email": AUTH_UNKNOWN_EMAIL, "password": "x" * 14}
    )
    bad_password = client.post(
        "/api/v1/admin/auth/login", json={"email": EDITOR, "password": "x" * 14}
    )
    no_password_account = client.post(
        "/api/v1/admin/auth/login", json={"email": FOUNDER, "password": "x" * 14}
    )
    assert unknown.status_code == bad_password.status_code == 401
    assert _problem(unknown) == _problem(bad_password) == _problem(no_password_account)
    assert _problem(unknown)["code"] == "UNAUTHENTICATED"
    assert _no_session_cookie(client)


async def test_lockout_after_five_failures_returns_429(client: TestClient, auth_env) -> None:  # noqa: ANN001
    for _ in range(5):
        failed = client.post(
            "/api/v1/admin/auth/login", json={"email": LOCKOUT, "password": "mauvais-mdp"}
        )
        assert failed.status_code == 401

    locked = client.post(
        "/api/v1/admin/auth/login", json={"email": LOCKOUT, "password": AUTH_PASSWORD}
    )
    assert locked.status_code == 429
    assert locked.json()["code"] == "RATE_LIMITED"
    retry_after = int(locked.headers["Retry-After"])
    assert 0 < retry_after <= 300  # 5 minutes de verrou initial


async def test_mfa_required_then_valid_code(client: TestClient, auth_env) -> None:  # noqa: ANN001
    first = client.post(
        "/api/v1/admin/auth/login", json={"email": MFA_EMAIL, "password": AUTH_PASSWORD}
    )
    assert first.status_code == 200
    assert first.json() == {"status": "mfa_required"}
    assert "set-cookie" not in first.headers  # pas de session tant que le code manque

    bad = client.post(
        "/api/v1/admin/auth/login",
        json={"email": MFA_EMAIL, "password": AUTH_PASSWORD, "totp_code": _WRONG_TOTP},
    )
    assert bad.status_code == 401
    assert _problem(bad)["code"] == "UNAUTHENTICATED"

    good = client.post(
        "/api/v1/admin/auth/login",
        json={
            "email": MFA_EMAIL,
            "password": AUTH_PASSWORD,
            "totp_code": pyotp.TOTP(TOTP_SECRET).now(),
        },
    )
    assert good.status_code == 200
    assert good.json()["status"] == "authenticated"
    assert good.json()["user"]["mfa_enabled"] is True


async def test_mandatory_mfa_enrollment_flow(client: TestClient, auth_env) -> None:  # noqa: ANN001
    """Rôle obligatoire non enrôlé : état dédié, puis enrôlement au 1er code."""
    secret = None

    first = client.post(
        "/api/v1/admin/auth/login", json={"email": ADMIN, "password": AUTH_PASSWORD}
    )
    assert first.status_code == 200
    body = first.json()
    assert body["status"] == "mfa_enrollment_required"
    enrollment = body["mfa_enrollment"]
    secret = enrollment["totp_secret"]
    assert secret
    assert enrollment["otpauth_uri"].startswith("otpauth://totp/")
    assert "<svg" in enrollment["qr_svg"]
    assert len(enrollment["backup_codes"]) == 10
    assert all(len(code.replace("-", "")) == 8 for code in enrollment["backup_codes"])
    assert "set-cookie" not in first.headers  # pas de session avant le code

    wrong = client.post(
        "/api/v1/admin/auth/login",
        json={"email": ADMIN, "password": AUTH_PASSWORD, "totp_code": _WRONG_TOTP},
    )
    assert wrong.status_code == 401
    assert _problem(wrong)["code"] == "UNAUTHENTICATED"

    ok = client.post(
        "/api/v1/admin/auth/login",
        json={
            "email": ADMIN,
            "password": AUTH_PASSWORD,
            "totp_code": pyotp.TOTP(secret).now(),
        },
    )
    assert ok.status_code == 200
    assert ok.json()["status"] == "authenticated"
    assert ok.json()["user"]["mfa_enabled"] is True
    assert client.cookies.get("session_id") is not None

    # Enrôlé : le login suivant réclame le code (état mfa_required).
    client.cookies.clear()
    enrolled = client.post(
        "/api/v1/admin/auth/login", json={"email": ADMIN, "password": AUTH_PASSWORD}
    )
    assert enrolled.status_code == 200
    assert enrolled.json() == {"status": "mfa_required"}


async def test_login_accepts_backup_code(client: TestClient, auth_env) -> None:  # noqa: ANN001
    """Code de secours (8 chiffres) : admission après enrôlement TOTP."""
    session: AsyncSession = auth_env["session"]
    user = await _user(session, MFA_EMAIL)

    enrolled = client.post(
        "/api/v1/admin/auth/login",
        json={
            "email": MFA_EMAIL,
            "password": AUTH_PASSWORD,
            "totp_code": pyotp.TOTP(TOTP_SECRET).now(),
        },
    )
    assert enrolled.status_code == 200
    assert enrolled.json()["status"] == "authenticated"

    backup = backup_codes(user.mfa_secret or "")[0]
    client.cookies.clear()
    by_backup = client.post(
        "/api/v1/admin/auth/login",
        json={"email": MFA_EMAIL, "password": AUTH_PASSWORD, "totp_code": backup},
    )
    assert by_backup.status_code == 200
    assert by_backup.json()["status"] == "authenticated"


# --------------------------------------------------------------- /auth/me ----


async def test_me_returns_roles_and_permissions(client: TestClient, auth_env) -> None:  # noqa: ANN001
    session: AsyncSession = auth_env["session"]
    user_id = auth_env["users"][EDITOR]

    login = client.post(
        "/api/v1/admin/auth/login", json={"email": EDITOR, "password": AUTH_PASSWORD}
    )
    assert login.status_code == 200

    me = client.get("/api/v1/admin/auth/me")
    assert me.status_code == 200
    body = me.json()
    assert body["user"]["id"] == str(user_id)
    assert body["user"]["roles"] == ["editor"]
    assert body["csrf_token"] == client.cookies.get("csrf_token")

    # Les permissions renvoyées sont exactement les liens de la base (sidebar).
    expected = sorted(
        (module, action, lang)
        for module, action, lang in (
            await session.execute(
                select(Permission.module, Permission.action, Permission.lang)
                .join(RolePermission, RolePermission.permission_id == Permission.id)
                .join(UserRole, UserRole.role_id == RolePermission.role_id)
                .where(UserRole.user_id == user_id)
            )
        ).all()
    )
    live = sorted((p["module"], p["action"], p["lang"]) for p in body["user"]["permissions"])
    assert live == expected


async def test_me_without_session_is_401(client: TestClient, auth_env) -> None:  # noqa: ANN001
    response = client.get("/api/v1/admin/auth/me")
    assert response.status_code == 401
    assert _problem(response)["code"] == "UNAUTHENTICATED"


async def test_logout_revokes_session(client: TestClient, auth_env) -> None:  # noqa: ANN001
    client.post("/api/v1/admin/auth/login", json={"email": EDITOR, "password": AUTH_PASSWORD})
    headers = {"X-CSRF-Token": client.cookies.get("csrf_token", "")}
    out = client.post("/api/v1/admin/auth/logout", headers=headers)
    assert out.status_code == 204

    after = client.get("/api/v1/admin/auth/me")
    assert after.status_code == 401
    assert _problem(after)["code"] in {"UNAUTHENTICATED", "SESSION_EXPIRED"}


# ------------------------------------------------------------ invitations ----


async def test_activate_with_totp_enrolls_mandatory_role(client: TestClient, auth_env) -> None:  # noqa: ANN001
    session: AsyncSession = auth_env["session"]
    founder = await _user(session, FOUNDER)
    token = await create_invitation(session, founder)
    await session.commit()
    await session.refresh(founder)
    assert founder.mfa_secret  # secret TOTP généré à la création de l'invitation

    too_short = client.post(
        "/api/v1/admin/auth/activate", json={"token": token, "password": "court"}
    )
    assert too_short.status_code == 422

    without_code = client.post(
        "/api/v1/admin/auth/activate", json={"token": token, "password": AUTH_PASSWORD}
    )
    assert without_code.status_code == 422
    assert _problem(without_code)["code"] == "VALIDATION_ERROR"

    wrong_code = client.post(
        "/api/v1/admin/auth/activate",
        json={"token": token, "password": AUTH_PASSWORD, "totp_code": _WRONG_TOTP},
    )
    assert wrong_code.status_code == 422

    ok = client.post(
        "/api/v1/admin/auth/activate",
        json={
            "token": token,
            "password": AUTH_PASSWORD,
            "totp_code": pyotp.TOTP(founder.mfa_secret).now(),
        },
    )
    assert ok.status_code == 200
    assert ok.json()["status"] == "authenticated"
    assert ok.json()["user"]["mfa_enabled"] is True
    assert ok.json()["user"]["must_reset_password"] is False
    assert client.cookies.get("session_id") is not None

    reused = client.post(
        "/api/v1/admin/auth/activate",
        json={
            "token": token,
            "password": "UnAutreMdp-14carac",
            "totp_code": pyotp.TOTP(founder.mfa_secret).now(),
        },
    )
    assert reused.status_code == 410
    assert _problem(reused)["code"] == "TOKEN_EXPIRED"


async def test_activate_optional_role_needs_no_totp(client: TestClient, auth_env) -> None:  # noqa: ANN001
    session: AsyncSession = auth_env["session"]
    user = await _user(session, ACTIVATE)
    token = await create_invitation(session, user)
    await session.commit()

    ok = client.post(
        "/api/v1/admin/auth/activate", json={"token": token, "password": AUTH_PASSWORD}
    )
    assert ok.status_code == 200
    assert ok.json()["user"]["mfa_enabled"] is False

    # Le compte peut ensuite se connecter sans code (rôle optionnel).
    client.cookies.clear()
    login = client.post(
        "/api/v1/admin/auth/login", json={"email": ACTIVATE, "password": AUTH_PASSWORD}
    )
    assert login.status_code == 200
    assert login.json()["status"] == "authenticated"


async def test_expired_invitation_is_410(client: TestClient, auth_env) -> None:  # noqa: ANN001
    session: AsyncSession = auth_env["session"]
    user = await _user(session, ACTIVATE)
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
    assert _problem(response)["code"] == "TOKEN_EXPIRED"


async def test_unknown_activation_token_is_410(client: TestClient, auth_env) -> None:  # noqa: ANN001
    response = client.post(
        "/api/v1/admin/auth/activate",
        json={"token": "jeton-quelconque", "password": AUTH_PASSWORD},
    )
    assert response.status_code == 410
    assert _problem(response)["code"] == "TOKEN_EXPIRED"


# --------------------------------------------------- mot de passe oublié ----


async def test_password_forgot_never_reveals_account(client: TestClient, auth_env) -> None:  # noqa: ANN001
    session: AsyncSession = auth_env["session"]
    known = client.post("/api/v1/admin/auth/password-forgot", json={"email": EDITOR})
    unknown = client.post("/api/v1/admin/auth/password-forgot", json={"email": AUTH_UNKNOWN_EMAIL})
    assert known.status_code == unknown.status_code == 202
    assert known.json() == unknown.json() == {"status": "accepted"}

    # Le jeton de réinitialisation n'est émis que pour le compte existant.
    invitations = (
        (
            await session.execute(
                select(Invitation).where(Invitation.user_id == auth_env["users"][EDITOR])
            )
        )
        .scalars()
        .all()
    )
    assert len(invitations) == 1
    assert invitations[0].consumed_at is None
    assert invitations[0].expires_at > invitations[0].created_at


async def test_password_reset_revokes_sessions_and_is_single_use(
    client: TestClient, auth_env
) -> None:  # noqa: ANN001
    session: AsyncSession = auth_env["session"]
    login = client.post(
        "/api/v1/admin/auth/login", json={"email": RESET, "password": AUTH_PASSWORD}
    )
    assert login.status_code == 200
    assert client.get("/api/v1/admin/auth/me").status_code == 200

    user = await _user(session, RESET)
    token = await create_invitation(session, user, purpose="reset")
    await session.commit()

    new_password = "Nouveau-Mot-De-Passe-24"
    reset = client.post(
        "/api/v1/admin/auth/password-reset",
        json={"token": token, "password": new_password},
    )
    assert reset.status_code == 204

    # Sessions révoquées (page 09 §2.2) : l'ancien cookie ne vaut plus rien.
    after = client.get("/api/v1/admin/auth/me")
    assert after.status_code == 401
    assert _problem(after)["code"] in {"UNAUTHENTICATED", "SESSION_EXPIRED"}

    # Usage unique du jeton.
    reused = client.post(
        "/api/v1/admin/auth/password-reset",
        json={"token": token, "password": "EncoreUnAutre-Mdp14"},
    )
    assert reused.status_code == 410

    # L'ancien mot de passe ne fonctionne plus, le nouveau oui.
    client.cookies.clear()
    old = client.post("/api/v1/admin/auth/login", json={"email": RESET, "password": AUTH_PASSWORD})
    assert old.status_code == 401
    fresh = client.post("/api/v1/admin/auth/login", json={"email": RESET, "password": new_password})
    assert fresh.status_code == 200


async def test_password_reset_with_bad_token_is_410(client: TestClient, auth_env) -> None:  # noqa: ANN001
    response = client.post(
        "/api/v1/admin/auth/password-reset",
        json={"token": "jeton-invalide", "password": AUTH_PASSWORD},
    )
    assert response.status_code == 410
    assert _problem(response)["code"] == "TOKEN_EXPIRED"


# --------------------------------------------------- changement mot de passe --


async def test_password_change_flow(client: TestClient, auth_env) -> None:  # noqa: ANN001
    client.post("/api/v1/admin/auth/login", json={"email": EDITOR, "password": AUTH_PASSWORD})
    csrf = {"X-CSRF-Token": client.cookies.get("csrf_token", "")}

    wrong_current = client.post(
        "/api/v1/admin/auth/password-change",
        json={"current_password": "faux-mot-de-passe", "new_password": "Nouveau-Mdp-14carac"},
        headers=csrf,
    )
    assert wrong_current.status_code == 403
    assert _problem(wrong_current)["code"] == "FORBIDDEN"

    too_short = client.post(
        "/api/v1/admin/auth/password-change",
        json={"current_password": AUTH_PASSWORD, "new_password": "court"},
        headers=csrf,
    )
    assert too_short.status_code == 422

    new_password = "Nouveau-Mdp-14carac!"
    changed = client.post(
        "/api/v1/admin/auth/password-change",
        json={"current_password": AUTH_PASSWORD, "new_password": new_password},
        headers=csrf,
    )
    assert changed.status_code == 204
    still = client.get("/api/v1/admin/auth/me")
    assert still.status_code == 200

    client.cookies.clear()
    old = client.post("/api/v1/admin/auth/login", json={"email": EDITOR, "password": AUTH_PASSWORD})
    assert old.status_code == 401
    fresh = client.post(
        "/api/v1/admin/auth/login", json={"email": EDITOR, "password": new_password}
    )
    assert fresh.status_code == 200


def test_auth_test_password_meets_contract() -> None:
    """Les comptes de test respectent le plancher de 14 caractères (contrat)."""
    assert all(password is None or len(password) >= 14 for _, password in AUTH_USERS.values())
