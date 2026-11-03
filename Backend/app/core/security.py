"""Primitives de sécurité — page 09 (Argon2id, jetons HMAC, TOTP, verrouillage).

Toutes les fonctions sont pures ou quasi pures (aucune écriture en base) :
les parcours applicatifs vivent dans `app/api/admin_auth.py` et
`app/services/invitations.py`.
"""

from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta
from math import ceil

import pyotp
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from app.core.config import get_settings

#: Longueur minimale (page 09 §2.1) — aussi portée par `minLength: 14` du contrat.
MIN_PASSWORD_LENGTH = 14

#: Verrouillage proportionnel (page 09 §2.2) : 5 échecs -> 5 min, x2, plafond 1 h.
LOCKOUT_THRESHOLD = 5
LOCKOUT_BASE_MINUTES = 5
LOCKOUT_MAX_MINUTES = 60

#: Durées de vie des jetons signés (page 09 §2.2 / contrat /admin/auth/*).
INVITATION_TTL_DAYS = 7
RESET_TTL_MINUTES = 60

_session_hasher = PasswordHasher()  # paramètres recommandés OWASP (argon2id)


# ------------------------------------------------------------- mots de passe --


def hash_password(password: str) -> str:
    """Hachage Argon2id (sel + paramètres inclus par argon2-cffi)."""
    return _session_hasher.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    """Comparaison sûre ; tout hachage illisible est réputé invalide."""
    try:
        return _session_hasher.verify(password_hash, password)
    except (InvalidHashError, VerificationError):
        return False


def password_is_strong(password: str) -> bool:
    """Contrôle de longueur (la complexité est couverte par la passephrases)."""
    return len(password) >= MIN_PASSWORD_LENGTH


# ------------------------------------------------------------------- jetons ---


def new_session_token() -> str:
    """Jeton de session opaque (cookie `session_id`, jamais stocké en clair)."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """SHA-256 hexa du jeton — ce qui est écrit en base (`token_hash`)."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def new_csrf_token() -> str:
    """Jeton CSRF double-envoi (cookie lisible + en-tête `X-CSRF-Token`)."""
    return secrets.token_urlsafe(32)


def _serializer(salt: str) -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(get_settings().secret_key, salt=salt)


def _sign(purpose: str, subject: uuid.UUID) -> str:
    return _serializer(purpose).dumps(str(subject))


def _unsign(purpose: str, token: str, ttl_seconds: int) -> uuid.UUID | None:
    """Décode un jeton signé ; `None` si signature, But de vie ou forme invalide."""
    try:
        raw = _serializer(purpose).loads(token, max_age=ttl_seconds)
        return uuid.UUID(str(raw))
    except (BadSignature, SignatureExpired, ValueError, TypeError):
        return None


def sign_invitation(user_id: uuid.UUID) -> str:
    """Jeton d'activation (TTL 7 jours, usage unique — Q-105, contrat activate)."""
    return _sign("admin-invitation", user_id)


def unsign_invitation(token: str) -> uuid.UUID | None:
    return _unsign("admin-invitation", token, INVITATION_TTL_DAYS * 86400)


def sign_reset(user_id: uuid.UUID) -> str:
    """Jeton de réinitialisation (TTL 1 h, usage unique — page 09 §2.2)."""
    return _sign("admin-password-reset", user_id)


def unsign_reset(token: str) -> uuid.UUID | None:
    return _unsign("admin-password-reset", token, RESET_TTL_MINUTES * 60)


# --------------------------------------------------------------------- TOTP ---


def new_totp_secret() -> str:
    """Secret TOTP base32 (colonne `users.mfa_secret`, 32 caractères)."""
    return pyotp.random_base32()


def totp_provisioning_uri(secret: str, email: str) -> str:
    """URI `otpauth://` délivrée hors bande dans l'e-mail d'invitation."""
    return pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name="EXAUCE")


def verify_totp(secret: str, code: str | None) -> bool:
    """Validation du code à 6 chiffres (fenêtre ±1 pour la dérive horloge)."""
    if not secret or not code:
        return False
    try:
        return pyotp.TOTP(secret).verify(code.replace(" ", ""), valid_window=1)
    except Exception:  # noqa: BLE001 — code mal formé => refus, jamais de 500
        return False


# --------------------------------------------------------------- verrouillage --


def lockout_remaining(
    attempts: list[tuple[datetime, bool]],
    now: datetime | None = None,
) -> int:
    """Secondes restantes de verrouillage (0 = connexion autorisée).

    `attempts` est anti-chronologique (du plus récent au plus ancien) et s'arrête
    à la dernière réussite éventuelle. Règle page 09 §2.2 : 5 échecs -> 5 min,
    durée x2 par échec supplémentaire, plafond 1 h.
    """
    current = now or datetime.now(UTC)
    failures: list[datetime] = []
    for at, succeeded in attempts:
        if succeeded:
            break
        failures.append(at)
    if len(failures) < LOCKOUT_THRESHOLD:
        return 0
    # `failures` est anti-chronologique : le 5e échec le plus ancien déclenche.
    triggered_at = failures[LOCKOUT_THRESHOLD - 1]
    duration_min = min(
        LOCKOUT_BASE_MINUTES * 2 ** (len(failures) - LOCKOUT_THRESHOLD),
        LOCKOUT_MAX_MINUTES,
    )
    expires_at = triggered_at + timedelta(minutes=duration_min)
    return max(0, ceil((expires_at - current).total_seconds()))
