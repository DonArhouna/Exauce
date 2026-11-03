"""Dépendances partagées (session authentifiée, probes, pagination, etc.)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.csrf import SESSION_COOKIE
from app.core.db import get_session
from app.core.errors import ApiError
from app.core.security import hash_token
from app.models.auth import Permission, Role, RolePermission, Session, User, UserRole


@dataclass(frozen=True)
class AuthContext:
    """Session valide + compte + rôles + permissions (source de vérité RBAC)."""

    row: Session
    user: User
    role_codes: list[str]
    permissions: list[Permission]


async def load_rbac(db: AsyncSession, user_id: uuid.UUID) -> tuple[list[str], list[Permission]]:
    """Codes de rôle + permissions effectives d'un compte (ordre stable)."""
    role_codes = sorted(
        code
        for (code,) in (
            await db.execute(
                select(Role.code)
                .join(UserRole, UserRole.role_id == Role.id)
                .where(UserRole.user_id == user_id)
            )
        ).all()
    )
    perm_result = await db.execute(
        select(Permission)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(UserRole, UserRole.role_id == RolePermission.role_id)
        .where(UserRole.user_id == user_id)
        .order_by(Permission.module, Permission.action, Permission.lang)
    )
    return role_codes, list(perm_result.scalars().unique())


async def get_auth_context(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_session)],
) -> AuthContext:
    """Valide le cookie `session_id` et charge le contexte RBAC complet.

    - cookie absent / session inconnue -> `401 UNAUTHENTICATED` ;
    - session révoquée ou expirée -> `401 SESSION_EXPIRED` (R14-8).
    """
    token = request.cookies.get(SESSION_COOKIE, "")
    if not token:
        raise ApiError(401, "UNAUTHENTICATED", "Authentification requise.")
    row = (
        await db.execute(select(Session).where(Session.token_hash == hash_token(token)))
    ).scalar_one_or_none()
    if row is None:
        raise ApiError(401, "UNAUTHENTICATED", "Authentification requise.")
    if row.revoked_at is not None or row.expires_at <= datetime.now(UTC):
        raise ApiError(401, "SESSION_EXPIRED", "Session expirée, reconnectez-vous.")
    user = (await db.execute(select(User).where(User.id == row.user_id))).scalar_one_or_none()
    if user is None or not user.is_active:
        raise ApiError(401, "SESSION_EXPIRED", "Session expirée, reconnectez-vous.")

    role_codes, permissions = await load_rbac(db, user.id)
    return AuthContext(row=row, user=user, role_codes=role_codes, permissions=permissions)
