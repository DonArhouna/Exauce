"""`POST /contact` — EF-301..303 (SC-301 contact nominal, SC-303 spam, SC-306 double clic).

Trois niveaux :
- **unitaires** : fenêtre glissante du rate limit, décisions anti-abus ;
- **validation** : 422 sans `Idempotency-Key` ou avec un corps invalide
  (aucune écriture, la validation précède le handler) ;
- **intégration** (base dev) : lead + outbox, rejou idempotent, 409 sur un
  payload différent, 429 + `Retry-After`, honeypot sans écriture.

Sans PostgreSQL, les tests d'intégration sautent (skip).
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator, Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.config import get_settings
from app.core.ratelimit import SlidingWindowLimiter, reset_contact_limiter
from app.models.i18n import Language
from app.models.idempotency import IdempotencyKey
from app.models.leads import Lead, OutboxEmail
from app.services.contact import (
    MIN_ELAPSED_MS,
    TEMPLATE_KEY,
    ContactRequest,
    is_suspect,
)

CONTACT_PATH = f"{get_settings().api_prefix}/contact"

#: E-mails réservés aux tests — purgés à chaque cycle de fixture.
TEST_EMAIL_PREFIX = "contact-test-"

#: Fenêtre de `POST /contact` (doc 08 §5 : 5 / 10 min).
CONTACT_WINDOW = 600.0


@pytest.fixture(autouse=True)
def _fresh_limiter() -> Iterator[None]:
    """Le compteur contact est un singleton : remis à zéro autour de chaque test."""
    reset_contact_limiter()
    yield
    reset_contact_limiter()


# ------------------------------------------------------------------ unitaires --


def test_rate_limiter_blocks_after_limit_then_slides() -> None:
    limiter = SlidingWindowLimiter(3, 60.0)
    now = 1_000.0

    assert limiter.retry_after("ip", now=now) is None
    assert limiter.retry_after("ip", now=now + 1) is None
    assert limiter.retry_after("ip", now=now + 2) is None

    retry = limiter.retry_after("ip", now=now + 3)
    assert retry is not None
    assert 0 < retry <= 60.0

    # Une autre IP n'est pas affectée (compartiment par clé).
    assert limiter.retry_after("other", now=now + 3) is None

    # La fenêtre glisse : le plus ancien jeton expire.
    assert limiter.retry_after("ip", now=now + 61) is None


def test_rate_limiter_refused_request_does_not_consume_a_token() -> None:
    """Un 429 ne prolonge pas le blocage (impossible de verrouiller la victime)."""
    limiter = SlidingWindowLimiter(1, 60.0)

    assert limiter.retry_after("ip", now=100.0) is None
    assert limiter.retry_after("ip", now=101.0) is not None
    assert limiter.retry_after("ip", now=102.0) is not None
    assert limiter.retry_after("ip", now=161.0) is None


def _base_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "name": "Awa Diop",
        "email": "contact-test-unit@exauceac.com",
        "subject": "Audit",
        "message": "Bonjour, je souhaite un audit.",
        "lang": "fr",
        "honeypot": "",
        "elapsed_ms": MIN_ELAPSED_MS,
    }
    payload.update(overrides)
    return payload


def test_is_suspect_decisions() -> None:
    assert not is_suspect(ContactRequest(**_base_payload()))
    assert is_suspect(ContactRequest(**_base_payload(elapsed_ms=MIN_ELAPSED_MS - 1)))
    # Délai absent : impossible de prouver la rédaction → bot (doc 09 §7).
    assert is_suspect(ContactRequest(**_base_payload(elapsed_ms=None)))
    assert is_suspect(ContactRequest(**_base_payload(honeypot="http://spam.example")))
    # Un honeypot volontairement vide (espaces) n'est pas suspect.
    assert not is_suspect(ContactRequest(**_base_payload(honeypot="   ")))


# ----------------------------------------------------------------- validation --


def test_contact_requires_idempotency_key(client: TestClient) -> None:
    response = client.post(CONTACT_PATH, json=_base_payload())

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


def test_contact_rejects_non_uuid_idempotency_key(client: TestClient) -> None:
    response = client.post(
        CONTACT_PATH,
        json=_base_payload(),
        headers={"Idempotency-Key": "pas-un-uuid"},
    )

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


def test_contact_rejects_missing_required_field(client: TestClient) -> None:
    body = _base_payload()
    body.pop("message")

    response = client.post(
        CONTACT_PATH,
        json=body,
        headers={"Idempotency-Key": str(uuid.uuid4())},
    )

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


# ------------------------------------------------------------------- anti-abus --


def test_contact_honeypot_returns_compliance_202(client: TestClient) -> None:
    """SC-303 : honeypot rempli → 202 de complaisance (aucune écriture ici)."""
    response = client.post(
        CONTACT_PATH,
        json=_base_payload(honeypot="http://spam.example"),
        headers={"Idempotency-Key": str(uuid.uuid4())},
    )

    assert response.status_code == 202
    body = response.json()
    assert body["status"] == "new"
    assert uuid.UUID(body["id"])  # UUID valide, mais jamais persisté


def test_contact_without_elapsed_ms_returns_compliance_202(client: TestClient) -> None:
    """Délai de rédaction absent → traité comme un bot (doc 09 §7)."""
    response = client.post(
        CONTACT_PATH,
        json=_base_payload(elapsed_ms=None),
        headers={"Idempotency-Key": str(uuid.uuid4())},
    )

    assert response.status_code == 202
    assert response.json()["status"] == "new"


# --------------------------------------------------------------- intégration --


@pytest.fixture()
async def session() -> AsyncIterator[AsyncSession]:
    """Session sur la base dev ; skip si PostgreSQL est injoignable ou non semée."""
    engine = create_async_engine(get_settings().database_url, pool_pre_ping=True)
    try:
        connection = await engine.connect()
    except Exception as exc:  # noqa: BLE001 — types d'erreur réseau variés
        await engine.dispose()
        pytest.skip(
            f"PostgreSQL injoignable ({exc.__class__.__name__}) — "
            "'docker compose up -d db' puis 'alembic upgrade head'"
        )
    sess = AsyncSession(bind=connection, expire_on_commit=False)
    seeded_lang = (await sess.execute(select(Language.code).limit(1))).first()
    if seeded_lang is None:
        await sess.close()
        await connection.close()
        await engine.dispose()
        pytest.skip("base non semée : 'python -m app.cli.seed' d'abord")
    try:
        await _purge(sess)
        await sess.commit()
        yield sess
    finally:
        await _purge(sess)
        await sess.commit()
        await sess.close()
        await connection.close()
        await engine.dispose()


async def _purge(session: AsyncSession) -> None:
    """Efface les traces de test (leads, clés, outbox de contact)."""
    await session.execute(delete(OutboxEmail).where(OutboxEmail.template_key == TEMPLATE_KEY))
    await session.execute(delete(IdempotencyKey).where(IdempotencyKey.scope == "contact"))
    await session.execute(delete(Lead).where(Lead.email.like(f"{TEST_EMAIL_PREFIX}%")))


def _post(client: TestClient, *, email: str, key: str | None = None, **overrides: Any) -> Any:
    return client.post(
        CONTACT_PATH,
        json=_base_payload(email=email, **overrides),
        headers={"Idempotency-Key": key or str(uuid.uuid4())},
    )


async def _lead_count(session: AsyncSession, email: str) -> int:
    rows = (await session.execute(select(Lead.id).where(Lead.email == email))).scalars()
    return len(list(rows))


async def test_contact_creates_lead_and_outbox(client: TestClient, session: AsyncSession) -> None:
    """SC-301 : 202, lead `new` + notification en file (outbox)."""
    email = f"{TEST_EMAIL_PREFIX}nominal@exauceac.com"

    response = _post(client, email=email)

    assert response.status_code == 202
    body = response.json()
    assert body["status"] == "new"
    lead_id = uuid.UUID(body["id"])
    assert response.headers.get("X-Idempotent-Replayed") is None

    lead = (await session.execute(select(Lead).where(Lead.id == lead_id))).scalar_one()
    assert lead.status == "new"
    assert lead.lang in {"fr", "en"}
    assert lead.subject == "Audit"

    outbox = (
        await session.execute(select(OutboxEmail).where(OutboxEmail.template_key == TEMPLATE_KEY))
    ).scalars()
    rows = list(outbox)
    assert len(rows) == 1
    assert rows[0].status == "pending"
    assert rows[0].payload["lead_id"] == body["id"]
    assert rows[0].lang == lead.lang


async def test_contact_replays_idempotent_key(client: TestClient, session: AsyncSession) -> None:
    """SC-306 : la même clé rejoue la réponse sans doubler (1 seul lead)."""
    email = f"{TEST_EMAIL_PREFIX}replay@exauceac.com"
    key = str(uuid.uuid4())

    first = _post(client, email=email, key=key)
    second = _post(client, email=email, key=key)

    assert first.status_code == 202
    assert second.status_code == 202
    assert first.json()["id"] == second.json()["id"]
    assert second.headers.get("X-Idempotent-Replayed") == "true"
    assert first.headers.get("X-Idempotent-Replayed") is None
    assert await _lead_count(session, email) == 1


async def test_contact_conflicts_on_key_reused_with_another_payload(
    client: TestClient, session: AsyncSession
) -> None:
    """Même clé, autre contenu → 409 `IDEMPOTENT_REPLAY_CONFLICT` (doc 08 §5)."""
    email = f"{TEST_EMAIL_PREFIX}conflit@exauceac.com"
    key = str(uuid.uuid4())

    first = _post(client, email=email, key=key)
    second = _post(client, email=email, key=key, message="Autre message, même clé.")

    assert first.status_code == 202
    assert second.status_code == 409
    assert second.json()["code"] == "IDEMPOTENT_REPLAY_CONFLICT"
    assert await _lead_count(session, email) == 1


async def test_contact_rate_limit_returns_429_with_retry_after(
    client: TestClient, session: AsyncSession
) -> None:
    """5 soumissions puis 429 + `Retry-After` (doc 08 §5)."""
    for index in range(get_settings().rate_limit_contact_per_10min):
        response = _post(client, email=f"{TEST_EMAIL_PREFIX}limit-{index}@exauceac.com")
        assert response.status_code == 202, response.text

    blocked = _post(client, email=f"{TEST_EMAIL_PREFIX}limit-final@exauceac.com")

    assert blocked.status_code == 429
    assert blocked.json()["code"] == "RATE_LIMITED"
    assert int(blocked.headers["Retry-After"]) >= 1
    assert blocked.headers["content-type"].startswith("application/problem+json")
    # La demande bloquée n'est pas enregistrée.
    assert await _lead_count(session, f"{TEST_EMAIL_PREFIX}limit-final@exauceac.com") == 0


async def test_contact_honeypot_writes_nothing(client: TestClient, session: AsyncSession) -> None:
    """SC-303 : ni lead, ni clé d'idempotence quand le honeypot est rempli."""
    email = f"{TEST_EMAIL_PREFIX}bot@exauceac.com"
    key = str(uuid.uuid4())

    response = _post(client, email=email, key=key, honeypot="http://spam.example")

    assert response.status_code == 202
    assert await _lead_count(session, email) == 0
    keys = (
        await session.execute(select(IdempotencyKey).where(IdempotencyKey.key == key))
    ).scalars()
    assert list(keys) == []
