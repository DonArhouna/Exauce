"""CLI d'émission d'invitation : python -m app.cli.invite <email> [--reset].

Utilitaire dev (base `--with-demo`) : tant que `POST /admin/users` (RBAC) n'est
pas livré, cette commande est le seul moyen d'émettre l'invitation du
fondateur et des comptes démo. L'e-mail part vers MailHog (localhost:1025) ;
le jeton est aussi imprimé pour débloquer un dev sans MailHog.

Usage :
    python -m app.cli.invite fondateur@exauceac.com
    python -m app.cli.invite fondateur@exauceac.com --reset
"""

from __future__ import annotations

import argparse
import asyncio

from sqlalchemy import select

from app.core.db import get_session_factory
from app.models.auth import User
from app.services.invitations import create_invitation


async def _run(email: str, reset: bool) -> int:
    factory = get_session_factory()
    async with factory() as session:
        user = (
            await session.execute(select(User).where(User.email == email.lower()))
        ).scalar_one_or_none()
        if user is None:
            print(f"compte introuvable : {email}")
            return 1
        purpose = "reset" if reset else "activate"
        token = await create_invitation(session, user, purpose=purpose)
        await session.commit()
        label = "reinitialisation (1 h)" if reset else "activation (7 jours)"
        print(f"invitation {purpose} emise pour {user.email} ({label})")
        print(f"jeton : {token}")
        print("e-mail envoye vers MailHog (localhost:1025)")
        if purpose == "activate" and user.mfa_secret:
            print("secret TOTP inclus dans l'e-mail (obligatoire pour ce role)")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m app.cli.invite",
        description="Emet une invitation signee (activation ou reinitialisation).",
    )
    parser.add_argument("email", help="e-mail du compte cible")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="lien de reinitialisation de mot de passe (1 h) au lieu de l'activation",
    )
    args = parser.parse_args(argv)
    return asyncio.run(_run(args.email, args.reset))


if __name__ == "__main__":
    raise SystemExit(main())
