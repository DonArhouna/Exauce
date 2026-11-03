"""Fixtures de test : application fraîche, overrides de dépendances, base auth.

Les fixtures `auth_env` préparent des comptes de test **dédiés** (e-mails
`auth-*@exauceac.com`) sur la base dev, puis les purgent à la sortie
(utilisateurs en cascade : sessions, invitations, rôles ; tentatives de
connexion par e-mail). Sans PostgreSQL joignable, elles sautent (skip),
comme les tests de seed.
"""

from __future__ import annotations

from collections.abc import AsyncIterator, Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.api.health import db_probe
from app.core.config import get_settings
from app.core.security import hash_password
from app.main import create_app
from app.models.auth import LoginAttempt, Role, User, UserRole
from app.models.i18n import Language

#: Mot de passe de test (20 caractères — plancher contrat : 14).
AUTH_PASSWORD = "Password-de-test-14!"

#: Secret TOTP fixe pour `auth-mfa` (les codes sont générés à la volée).
TOTP_SECRET = "JBSWY3DPEHPK3PXP"

#: e-mail -> (rôle, mot de passe | None pour activation/invitation).
AUTH_USERS: dict[str, tuple[str, str | None]] = {
    "auth-editor@exauceac.com": ("editor", AUTH_PASSWORD),
    "auth-lockout@exauceac.com": ("editor", AUTH_PASSWORD),
    "auth-admin@exauceac.com": ("admin", AUTH_PASSWORD),
    "auth-mfa@exauceac.com": ("editor", AUTH_PASSWORD),
    "auth-founder@exauceac.com": ("super_admin", None),
    "auth-activate@exauceac.com": ("editor", None),
    "auth-reset@exauceac.com": ("editor", AUTH_PASSWORD),
}
MFA_EMAIL = "auth-mfa@exauceac.com"

#: Rôles semés (doc 06 §6.2) — recréés si la base n'a pas encore été seedée.
SEEDED_ROLES: dict[str, str] = {
    "super_admin": "Super-admin",
    "admin": "Administrateur",
    "editor": "Rédacteur",
    "reviewer": "Relecteur",
    "crm": "Chargé de relation clients",
    "viewer": "Lecteur",
}


async def _connect_or_skip() -> tuple[Any, AsyncSession]:
    """Connexion à la base dev ; skip si PostgreSQL est injoignable."""
    engine = create_async_engine(get_settings().database_url, pool_pre_ping=True)
    try:
        connection = await engine.connect()
    except Exception as exc:  # noqa: BLE001 — types d'erreur réseau variés
        await engine.dispose()
        pytest.skip(
            f"PostgreSQL injoignable ({exc.__class__.__name__}) — "
            "'docker compose up -d db' puis 'alembic upgrade head'"
        )
    session = AsyncSession(bind=connection, expire_on_commit=False)
    return engine, session


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


async def _probe_up() -> str:
    return "up"


async def _probe_down() -> str:
    return "down"


@pytest.fixture()
async def auth_env() -> AsyncIterator[dict[str, Any]]:
    """Comptes de test + session SQL dédiée ; purge complète à la sortie."""
    engine, session = await _connect_or_skip()
    connection = session.bind
    try:
        seeded_lang = (await session.execute(select(Language.code).limit(1))).first()
        if seeded_lang is None:
            pytest.skip("base non semée : 'python -m app.cli.seed' d'abord")

        # Rôles manquants (base après migration seule).
        role_ids = dict((await session.execute(select(Role.code, Role.id))).all())
        for code, label in SEEDED_ROLES.items():
            if code not in role_ids:
                session.add(Role(code=code, label=label))
        await session.flush()
        role_ids = dict((await session.execute(select(Role.code, Role.id))).all())

        # Purge des comptes de test résiduels (crash précédent), puis création.
        await session.execute(delete(User).where(User.email.in_(AUTH_USERS)))
        await session.execute(delete(LoginAttempt).where(LoginAttempt.email.in_(AUTH_USERS)))
        users: dict[str, Any] = {}
        for email, (role, password) in AUTH_USERS.items():
            user = User(
                email=email,
                display_name=f"Compte {email.split('@')[0]}",
                password_hash=hash_password(password) if password else None,
                is_active=True,
                mfa_active=email == MFA_EMAIL,
                mfa_secret=TOTP_SECRET if email == MFA_EMAIL else None,
                must_reset_password=password is None,
                default_lang="fr",
            )
            session.add(user)
            await session.flush()
            session.add(UserRole(user_id=user.id, role_id=role_ids[role]))
            users[email] = user.id
        await session.commit()
        yield {"session": session, "users": users}
    finally:
        await session.execute(delete(User).where(User.email.in_(AUTH_USERS)))
        await session.execute(delete(LoginAttempt).where(LoginAttempt.email.in_(AUTH_USERS)))
        await session.commit()
        await session.close()
        await connection.close()
        await engine.dispose()
