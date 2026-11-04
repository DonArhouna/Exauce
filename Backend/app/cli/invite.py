"""CLI d'invitation : python -m app.cli.invite <email> | --demo [--reset].

Utilitaire dev (base `--with-demo`) : tant que `POST /admin/users` (RBAC) n'est
pas livré, cette commande est le moyen d'émettre les invitations du fondateur
et des comptes démo. Les e-mails partent vers MailHog (localhost:1025) ; le
jeton est aussi imprimé pour débloquer un dev sans MailHog.

Usage :
    python -m app.cli.invite fondateur@exauceac.com
    python -m app.cli.invite demo-editor@exauceac.com --reset
    python -m app.cli.invite --demo          # 5 comptes démo (refusé en prod)
"""

from __future__ import annotations

import argparse
import asyncio

from sqlalchemy import select

from app.core.config import get_settings
from app.core.db import get_session_factory
from app.models.auth import User
from app.seed.payload import DEMO_USERS
from app.services.invitations import create_invitation

EXIT_OK = 0
EXIT_ERROR = 1
EXIT_REFUSED = 2


async def _invite(session, email: str, *, reset: bool) -> bool:  # noqa: ANN001
    """Émet l'invitation d'un compte existant ; `False` si le compte est absent."""
    user = (
        await session.execute(select(User).where(User.email == email.lower()))
    ).scalar_one_or_none()
    if user is None:
        print(f"compte introuvable : {email} (seed --with-demo ?)")
        return False
    purpose = "reset" if reset else "activate"
    token = await create_invitation(session, user, purpose=purpose)
    await session.commit()
    label = "reinitialisation (1 h)" if reset else "activation (7 jours)"
    print(f"invitation {purpose} emise pour {user.email} ({label})")
    print(f"jeton : {token}")
    if purpose == "activate" and user.mfa_secret:
        print("  -> secret TOTP inclus dans l'e-mail (MFA obligatoire pour ce role)")
    return True


async def _run(email: str, reset: bool) -> int:
    async with get_session_factory()() as session:
        if not await _invite(session, email, reset=reset):
            return EXIT_ERROR
        print("e-mail envoye vers MailHog (localhost:1025)")
    return EXIT_OK


async def _run_demo(reset: bool = False) -> int:
    """Invite les 5 comptes démo — refus catégorique en production (Q-104)."""
    if get_settings().is_production:
        print("REFUS : comptes de demo interdits en production (Q-104, doc 06 6.2)")
        return EXIT_REFUSED
    invited = 0
    async with get_session_factory()() as session:
        for local, _role, _label in DEMO_USERS:
            if await _invite(session, f"{local}@exauceac.com", reset=reset):
                invited += 1
    if invited == 0:
        print("aucun compte demo : lancer 'python -m app.cli.seed --with-demo'")
        return EXIT_ERROR
    print(f"{invited}/5 comptes de demo invites — e-mails dans MailHog (localhost:1025)")
    return EXIT_OK


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m app.cli.invite",
        description="Emet une invitation signee (activation ou reinitialisation).",
    )
    parser.add_argument("email", nargs="?", help="e-mail du compte cible")
    parser.add_argument(
        "--demo",
        action="store_true",
        help="invite les 5 comptes de demo --with-demo (refuse en production)",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="lien de reinitialisation de mot de passe (1 h) au lieu de l'activation",
    )
    args = parser.parse_args(argv)
    if args.demo and args.email:
        parser.error("email et --demo sont mutuellement exclusifs")
    if args.demo:
        return asyncio.run(_run_demo(args.reset))
    if not args.email:
        parser.error("email requis (ou --demo)")
    return asyncio.run(_run(args.email, args.reset))


if __name__ == "__main__":
    raise SystemExit(main())
