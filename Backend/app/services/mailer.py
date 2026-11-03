"""Envoi d'e-mails transactionnels vers MailHog en dev (page 11 §3).

`outbox_emails` (Sprint 4) n'existe pas encore : l'envoi est direct via
SMTP (`smtplib` appelé dans un thread pour ne pas bloquer la boucle async).
Un échec de transport n'est jamais une erreur HTTP — il est journalisé.
"""

from __future__ import annotations

import asyncio
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def _send_sync(message: EmailMessage) -> None:
    settings = get_settings()
    with smtplib.SMTP(settings.mailhog_host, settings.mailhog_port, timeout=10) as smtp:
        smtp.send_message(message)


async def send_mail(*, to: str, subject: str, body: str) -> bool:
    """Envoie un mail texte ; `False` si le transport échoue (jamais de 500)."""
    settings = get_settings()
    message = EmailMessage()
    message["From"] = settings.mail_from
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)
    try:
        await asyncio.to_thread(_send_sync, message)
    except (OSError, smtplib.SMTPException) as exc:
        logger.error(
            "échec d'envoi à %s:%s (%s)", settings.mailhog_host, settings.mailhog_port, exc
        )
        return False
    return True
