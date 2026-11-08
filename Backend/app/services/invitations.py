"""Invitations signées et liens de réinitialisation (Q-105 / page 09 §2.2).

Les deux flux réutilisent la table `invitations` (jetons disjoints par leur
`purpose` signé : ni l'activation ni la réinitialisation n'acceptent l'autre
jeton) — aucun changement de schéma.
"""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import (
    INVITATION_TTL_DAYS,
    RESET_TTL_MINUTES,
    hash_token,
    new_totp_secret,
    sign_invitation,
    sign_reset,
    totp_provisioning_uri,
    unsign_invitation,
    unsign_reset,
)
from app.models.auth import Invitation, Role, User, UserRole
from app.services.mailer import send_mail

logger = logging.getLogger(__name__)

#: Rôles imposant le MFA TOTP (page 09 §2.1 — décision 2026-11-03).
MFA_MANDATORY_ROLES = frozenset({"super_admin", "admin", "crm"})


async def user_role_codes(session: AsyncSession, user_id: uuid.UUID) -> list[str]:
    """Codes de rôle d'un compte (ordre stable)."""
    rows = await session.execute(
        select(Role.code)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(UserRole.user_id == user_id)
    )
    return sorted(code for (code,) in rows.all())


async def has_mandatory_mfa(
    session: AsyncSession, user_id: uuid.UUID, role_codes: list[str] | None = None
) -> bool:
    """True si le compte relève d'un rôle à MFA obligatoire."""
    codes = role_codes if role_codes is not None else await user_role_codes(session, user_id)
    return bool(MFA_MANDATORY_ROLES.intersection(codes))


async def create_invitation(
    session: AsyncSession,
    user: User,
    *,
    created_by: User | None = None,
    purpose: str = "activate",
) -> str:
    """Émet un jeton unique (TTL 7 j) et l'e-mail qui le porte.

    Pour un rôle à MFA obligatoire, un secret TOTP est généré ici et son URI
    `otpauth://` est délivrée dans le même e-mail (enrôlement hors bande,
    contrat `AdminActivateRequest.totp_code`). Retourne le jeton en clair
    (l'e-mail n'est qu'un transport : les tests et le CLI l'utilisent).
    """
    token = sign_invitation(user.id) if purpose == "activate" else sign_reset(user.id)
    ttl_days = INVITATION_TTL_DAYS if purpose == "activate" else 0
    ttl_minutes = 0 if purpose == "activate" else RESET_TTL_MINUTES
    roles = await user_role_codes(session, user.id)
    provisioning: str | None = None
    if purpose == "activate" and await has_mandatory_mfa(session, user.id, roles):
        user.mfa_secret = new_totp_secret()
        user.mfa_active = False
        provisioning = totp_provisioning_uri(user.mfa_secret, user.email)

    invitation = Invitation(
        user_id=user.id,
        token_hash=hash_token(token),
        created_by=created_by.id if created_by else None,
        expires_at=datetime.now(UTC) + timedelta(days=ttl_days, minutes=ttl_minutes),
    )
    session.add(invitation)
    await session.flush()

    base = get_settings().public_base_url.rstrip("/")
    if purpose == "activate":
        link = f"{base}/admin/activate?token={token}"
        body = (
            "Bonjour,\n\n"
            "Une invitation a été créée pour votre compte back-office EXAUCE.\n\n"
            f"Activation (valable {INVITATION_TTL_DAYS} jours, usage unique) :\n{link}\n\n"
            f"Jeton (si le lien est inaccessible) : {token}\n"
        )
        if provisioning:
            body += (
                "\nCe rôle exige le MFA TOTP. Scannez cette URI hors bande (ou "
                "saisissez-la dans votre application d'authentification) :\n"
                f"{provisioning}\n\n"
                "Un code TOTP sera demandé à l'activation.\n"
            )
        body += "\nL'équipe EXAUCE"
        subject = "Invitation d'activation — back-office EXAUCE"
    else:
        link = f"{base}/admin/reset-password?token={token}"
        body = (
            "Bonjour,\n\n"
            "Demande de réinitialisation du mot de passe de votre compte "
            "back-office EXAUCE.\n\n"
            f"Lien (valable {RESET_TTL_MINUTES} minutes, usage unique) :\n{link}\n\n"
            f"Jeton (si le lien est inaccessible) : {token}\n\n"
            "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message."
        )
        subject = "Réinitialisation du mot de passe — back-office EXAUCE"

    await send_mail(to=user.email, subject=subject, body=body)
    return token


async def find_usable_invitation(
    session: AsyncSession, token: str, *, purpose: str
) -> tuple[Invitation, User] | None:
    """Valide jeton signé + ligne en base ; `None` = expiré, réutilisé ou inconnu.

    `purpose` verrouille le jeton à son usage : un jeton de réinitialisation
    est rejeté par `/admin/auth/activate` et inversement.
    """
    user_id = unsign_invitation(token) if purpose == "activate" else unsign_reset(token)
    if user_id is None:
        return None
    invitation = (
        await session.execute(select(Invitation).where(Invitation.token_hash == hash_token(token)))
    ).scalar_one_or_none()
    if invitation is None or invitation.consumed_at is not None:
        return None
    if invitation.user_id != user_id or invitation.expires_at <= _utcnow():
        return None
    user = (
        await session.execute(select(User).where(User.id == invitation.user_id))
    ).scalar_one_or_none()
    if user is None:
        return None
    return invitation, user


def _utcnow() -> datetime:
    return datetime.now(UTC)
