"""Fabrication de l'application FastAPI.

Le contrat d'API (`Analyse/modelisation/docs/openapi.yaml`) est la source de
vérité : toute divergence se traite par modification du contrat, jamais en
silence. Le schema OpenAPI servi par `/docs` est calqué sur le contrat.
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import yaml
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app import __version__
from app.api import admin_auth, health, public_contact, public_content, public_sitemap
from app.core.config import Settings, get_settings
from app.core.csrf import CsrfMiddleware
from app.core.db import dispose_engine
from app.core.errors import (
    ApiError,
    api_error_handler,
    http_exception_handler,
    unhandled_exception_handler,
    validation_error_handler,
)
from app.core.logging import configure_logging
from app.core.middleware import RequestContextMiddleware

logger = logging.getLogger(__name__)

# Backend/app/main.py -> Backend -> EXAUCE -> Analyse/modelisation/docs
_DEFAULT_CONTRACT_PATH = (
    Path(__file__).resolve().parents[2] / "Analyse" / "modelisation" / "docs" / "openapi.yaml"
)


def resolve_contract_path(settings: Settings) -> Path:
    """Chemin du contrat : `EXAUCE_CONTRACT_PATH` si fourni, sinon le repo local."""
    if settings.contract_path:
        return Path(settings.contract_path)
    return _DEFAULT_CONTRACT_PATH


def _load_contract(settings: Settings) -> dict[str, Any] | None:
    """Charge `openapi.yaml` s'il est présent, sinon `None` (schema généré)."""
    path = resolve_contract_path(settings)
    if not path.exists():
        logger.warning("Contrat OpenAPI introuvable à %s", path)
        return None
    with path.open(encoding="utf-8") as handle:
        data: dict[str, Any] = yaml.safe_load(handle)
    return data


def _apply_contract(app: FastAPI, contract: dict[str, Any] | None) -> None:
    """Publie le contrat validé comme schema OpenAPI servi par `/docs`.

    Les routes non implémentées n'apparaissent pas dans `/docs` tant qu'elles
    ne sont pas déclarées : le contrat reste la référence, la génération
    serveur ne sert qu'au debug et aux tests de contrat.
    """
    if contract is None:
        return
    app.openapi_schema = contract
    # FastAPI invalide son cache si le compteur de routes bouge : on fige le
    # compteur courant pour que le contrat servi ne soit jamais régénéré.
    # `test_served_schema_is_the_contract` verrouille ce comportement.
    app._openapi_routes_version = app.router._get_routes_version()  # noqa: SLF001


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Démarrage / arrêt propres (aucune migration auto : Alembic est explicite)."""
    configure_logging()
    logger.info("démarrage", extra={"version": __version__, "app": app.title})
    yield
    await dispose_engine()
    logger.info("arrêt")


def create_app(settings: Settings | None = None) -> FastAPI:
    """Construit l'application ; `settings` est surchargé dans les tests."""
    cfg = settings or get_settings()

    app = FastAPI(
        title="EXAUCE Backend — API v1",
        version=__version__,
        description=(
            "API du CMS EXAUCE Audit & Conseils. Contrat de référence : "
            "`Analyse/modelisation/docs/openapi.yaml`."
        ),
        lifespan=lifespan,
        docs_url=None if cfg.is_production else "/docs",
        redoc_url=None if cfg.is_production else "/redoc",
    )

    # CORS : origines explicites, credentials autorisés, jamais de wildcard.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cfg.cors_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Request-Id", "ETag", "Retry-After", "Server-Timing"],
    )
    # CSRF (ADR-009) : sous le correlation id, au-dessus du CORS.
    app.add_middleware(CsrfMiddleware)
    app.add_middleware(RequestContextMiddleware)

    app.add_exception_handler(Exception, unhandled_exception_handler)
    # Starlette exige `Callable[[Request, Exception], ...]` ; les handlers
    # sont typés sur la sous-exception qu'ils traitent (dispatch runtime).
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, validation_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(ApiError, api_error_handler)  # type: ignore[arg-type]

    app.include_router(health.router, prefix=cfg.api_prefix)
    app.include_router(admin_auth.router, prefix=cfg.api_prefix)
    app.include_router(public_contact.router, prefix=cfg.api_prefix)
    app.include_router(public_content.router, prefix=cfg.api_prefix)
    app.include_router(public_sitemap.router, prefix=cfg.api_prefix)
    _apply_contract(app, _load_contract(cfg))

    return app


app = create_app()
