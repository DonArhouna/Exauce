"""Routes d'authentification back-office — contrat `/admin/auth/*` (page 09).

Parcours : login (+ MFA TOTP, verrouillage, anti-énumération), logout,
`me` (permissions pour la sidebar du Backoffice), mot de passe oublié /
réinitialisation / changement, activation par invitation (Q-105).
"""

from __future__ import annotations

import ipaddress
from datetime import UTC, datetime, timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AuthContext, get_auth_context, load_rbac
from app.core.config import get_settings
from app.core.csrf import CSRF_COOKIE, SESSION_COOKIE
from app.core.db import get_session
from app.core.errors import ApiError
from app.core.security import (
    hash_password,
    hash_token,
    lockout_remaining,
    new_csrf_token,
    new_session_token,
    password_is_strong,
    verify_password,
    verify_totp,
)
from app.models.auth import LoginAttempt, Session, User
from app.services.invitations import create_invitation, find_usable_invitation

router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])

#: Message unique « compte inconnu / mot de passe faux » (page 09 §2.2).
_INVALID_CREDENTIALS = "Identifiants invalides."


# ------------------------------------------------------------------ schémas ---


class AdminLoginRequest(BaseModel):
    """Contrat `AdminLoginRequest` (password min 1 : le contrôle est côté 401)."""

    email: EmailStr
    password: str = Field(min_length=1)
    totp_code: str | None = Field(default=None, min_length=6, max_length=8)


class AdminForgotRequest(BaseModel):
    email: EmailStr


class TokenPasswordRequest(BaseModel):
    token: str = Field(min_length=1)
    password: str = Field(min_length=14)


class AdminActivateRequest(TokenPasswordRequest):
    totp_code: str | None = Field(default=None, min_length=6, max_length=8)


class AdminPasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=14)


# ---------------------------------------------------------------- utilitaires ---


def session_user_payload(
    user: User, role_codes: list[str], permissions: list[Any]
) -> dict[str, Any]:
    """Corps `AdminSessionUser` du contrat (roles + permissions pour la sidebar)."""
    return {
        "id": str(user.id),
        "email": user.email,
        "display_name": user.display_name,
        "is_active": user.is_active,
        "default_lang": user.default_lang,
        "must_reset_password": user.must_reset_password,
        "mfa_enabled": user.mfa_active,
        "roles": role_codes,
        "permissions": [
            {"id": str(p.id), "module": p.module, "action": p.action, "lang": p.lang}
            for p in permissions
        ],
    }


def _client_ip(request: Request) -> str | None:
    """IP réelle si elle est valide INET (TestClient fournit un hôte fictif)."""
    host = request.client.host if request.client else None
    if not host:
        return None
    try:
        ipaddress.ip_address(host)
    except ValueError:
        return None
    return host


async def _record_attempt(db: AsyncSession, email: str, succeeded: bool, request: Request):
    db.add(LoginAttempt(email=email, succeeded=succeeded, ip=_client_ip(request)))
    await db.commit()


async def _raise_if_locked(db: AsyncSession, email: str) -> None:
    """429 + `Retry-After` tant que le verrou exponentiel est actif (page 09 §2.2)."""
    rows = (
        await db.execute(
            select(LoginAttempt.at, LoginAttempt.succeeded)
            .where(LoginAttempt.email == email)
            .order_by(LoginAttempt.at.desc())
            .limit(64)
        )
    ).all()
    remaining = lockout_remaining([(at, bool(succeeded)) for at, succeeded in rows])
    if remaining:
        raise ApiError(
            429,
            "RATE_LIMITED",
            f"Trop de tentatives échouées, réessayez dans {remaining} secondes.",
            headers={"Retry-After": str(remaining)},
        )


def _issue_session(response: Response, request: Request, user: User) -> tuple[str, str]:
    """Crée la ligne `sessions` (jeton haché) et pose les deux cookies (ADR-009)."""
    settings = get_settings()
    token = new_session_token()
    csrf = new_csrf_token()
    request.state.session_token = token
    request.state.csrf_token = csrf
    max_age = settings.session_idle_minutes * 60
    secure = settings.is_production
    domain = settings.cookie_domain or None
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=max_age,
        httponly=True,
        secure=secure,
        samesite="lax",
        path="/",
        domain=domain,
    )
    response.set_cookie(
        CSRF_COOKIE,
        csrf,
        max_age=max_age,
        httponly=False,
        secure=secure,
        samesite="lax",
        path="/",
        domain=domain,
    )
    return token, csrf


async def _persist_session(db: AsyncSession, request: Request, user: User) -> None:
    settings = get_settings()
    agent = request.headers.get("user-agent", "")[:400] or None
    db.add(
        Session(
            user_id=user.id,
            token_hash=hash_token(request.state.session_token),
            expires_at=datetime.now(UTC) + timedelta(minutes=settings.session_idle_minutes),
            ip=_client_ip(request),
            user_agent=agent,
        )
    )
    user.last_login_at = datetime.now(UTC)
    await db.commit()


# ------------------------------------------------------------------- routes ---


@router.post("/login")
async def login(
    payload: AdminLoginRequest,
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_session)],
) -> dict[str, Any]:
    """Connexion : verrouillage, anti-énumération, puis `authenticated`/`mfa_required`."""
    email = payload.email.lower()
    await _raise_if_locked(db, email)

    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    credentials_ok = (
        user is not None
        and user.is_active
        and user.password_hash is not None
        and verify_password(user.password_hash, payload.password)
    )
    if not credentials_ok:
        await _record_attempt(db, email, succeeded=False, request=request)
        raise ApiError(401, "UNAUTHENTICATED", _INVALID_CREDENTIALS)

    assert user is not None  # credentials_ok implique user
    role_codes, permissions = await load_rbac(db, user.id)
    mandatory = {"super_admin", "admin", "crm"}.intersection(role_codes)
    if mandatory and not user.mfa_active:
        # Écart signalé au Backoffice : à ajouter aux réponses de login (PR contrat).
        raise ApiError(
            403,
            "FORBIDDEN",
            "Ce rôle impose le MFA : activez votre compte via l'invitation "
            "(secret TOTP fourni par e-mail).",
        )

    if user.mfa_active:
        if payload.totp_code is None:
            return {"status": "mfa_required"}
        if not verify_totp(user.mfa_secret or "", payload.totp_code):
            await _record_attempt(db, email, succeeded=False, request=request)
            raise ApiError(401, "UNAUTHENTICATED", "Code de vérification invalide.")

    await _record_attempt(db, email, succeeded=True, request=request)
    _issue_session(response, request, user)
    await _persist_session(db, request, user)
    return {
        "status": "authenticated",
        "user": session_user_payload(user, role_codes, permissions),
        "csrf_token": request.state.csrf_token,
    }


@router.post("/logout", status_code=204)
async def logout(
    ctx: Annotated[AuthContext, Depends(get_auth_context)],
    db: Annotated[AsyncSession, Depends(get_session)],
) -> Response:
    """Révoque la session courante (R14-8) et efface les deux cookies."""
    ctx.row.revoked_at = datetime.now(UTC)
    await db.commit()
    settings = get_settings()
    response = Response(status_code=204)
    domain = settings.cookie_domain or None
    response.delete_cookie(SESSION_COOKIE, path="/", domain=domain)
    response.delete_cookie(CSRF_COOKIE, path="/", domain=domain)
    return response


@router.get("/me")
async def me(
    request: Request,
    response: Response,
    ctx: Annotated[AuthContext, Depends(get_auth_context)],
) -> dict[str, Any]:
    """Session courante, rôles, permissions et réémission du jeton CSRF."""
    csrf = request.cookies.get(CSRF_COOKIE) or new_csrf_token()
    settings = get_settings()
    response.set_cookie(
        CSRF_COOKIE,
        csrf,
        max_age=settings.session_idle_minutes * 60,
        httponly=False,
        secure=settings.is_production,
        samesite="lax",
        path="/",
        domain=settings.cookie_domain or None,
    )
    return {
        "user": session_user_payload(ctx.user, ctx.role_codes, ctx.permissions),
        "csrf_token": csrf,
    }


@router.post("/password-forgot", status_code=202)
async def password_forgot(
    payload: AdminForgotRequest,
    db: Annotated[AsyncSession, Depends(get_session)],
) -> dict[str, str]:
    """Toujours 202 (anti-énumération) ; le mail part seulement si le compte existe."""
    email = payload.email.lower()
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if user is not None and user.is_active and user.password_hash is not None:
        await create_invitation(db, user, purpose="reset")
        await db.commit()
    return {"status": "accepted"}


@router.post("/password-reset", status_code=204)
async def password_reset(
    payload: TokenPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_session)],
) -> Response:
    """Pose le nouveau mot de passe via le lien signé (1 h, usage unique)."""
    found = await find_usable_invitation(db, payload.token, purpose="reset")
    if found is None:
        raise ApiError(410, "TOKEN_EXPIRED", "Lien expiré, déjà utilisé ou invalide.")
    invitation, user = found
    if not password_is_strong(payload.password):
        raise ApiError(422, "VALIDATION_ERROR", "Mot de passe : 14 caractères minimum.")
    user.password_hash = hash_password(payload.password)
    user.must_reset_password = False
    invitation.consumed_at = datetime.now(UTC)
    # Révocation des sessions existantes (page 09 §2.2).
    await db.execute(
        update(Session)
        .where(Session.user_id == user.id, Session.revoked_at.is_(None))
        .values(revoked_at=datetime.now(UTC))
    )
    await db.commit()
    return Response(status_code=204)


@router.post("/password-change", status_code=204)
async def password_change(
    payload: AdminPasswordChangeRequest,
    ctx: Annotated[AuthContext, Depends(get_auth_context)],
    db: Annotated[AsyncSession, Depends(get_session)],
) -> Response:
    """Changement avec session active (dont `must_reset_password`)."""
    user = ctx.user
    if user.password_hash is None or not verify_password(
        user.password_hash, payload.current_password
    ):
        raise ApiError(403, "FORBIDDEN", "Mot de passe actuel invalide.")
    if not password_is_strong(payload.new_password):
        raise ApiError(422, "VALIDATION_ERROR", "Mot de passe : 14 caractères minimum.")
    user.password_hash = hash_password(payload.new_password)
    user.must_reset_password = False
    await db.commit()
    return Response(status_code=204)


@router.post("/activate")
async def activate(
    payload: AdminActivateRequest,
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_session)],
) -> dict[str, Any]:
    """Activation par invitation (Q-105) : mot de passe + enrôlement TOTP obligatoire."""
    found = await find_usable_invitation(db, payload.token, purpose="activate")
    if found is None:
        raise ApiError(410, "TOKEN_EXPIRED", "Invitation expirée, déjà utilisée ou invalide.")
    invitation, user = found
    if not password_is_strong(payload.password):
        raise ApiError(422, "VALIDATION_ERROR", "Mot de passe : 14 caractères minimum.")

    if user.mfa_secret:
        # Rôle à MFA obligatoire : le secret provient de l'e-mail d'invitation.
        if not verify_totp(user.mfa_secret, payload.totp_code):
            raise ApiError(
                422,
                "VALIDATION_ERROR",
                "Code TOTP requis pour ce rôle : saisissez celui de l'application "
                "d'authentification enregistrée avec le secret de l'invitation.",
            )
        user.mfa_active = True

    user.password_hash = hash_password(payload.password)
    user.must_reset_password = False
    user.is_active = True
    invitation.consumed_at = datetime.now(UTC)
    await db.commit()

    role_codes, permissions = await load_rbac(db, user.id)
    _issue_session(response, request, user)
    await _persist_session(db, request, user)
    return {
        "status": "authenticated",
        "user": session_user_payload(user, role_codes, permissions),
        "csrf_token": request.state.csrf_token,
    }


__all__ = ["router"]
