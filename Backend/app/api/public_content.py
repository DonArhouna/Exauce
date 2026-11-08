"""Endpoints publics de contenu — contrat `/services-tree` … `/search`.

Lecture seule, sans authentification. Les formes de réponse suivent
`openapi.yaml` (schemas `ServicesTree`, `Family`, `DomainDetail`, `Sector`,
`InterventionType`, `Office`, `TeamMember`, `PublicationSummary/Detail`,
`PageDetail`, `PublicSettings`, `Language`, `SearchHit`).
"""

from __future__ import annotations

import hashlib
import json
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header, Path, Query, Response
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.services import public_content

router = APIRouter(tags=["public-content"])

LangQuery = Annotated[
    str | None,
    Query(description="BCP-47 (fr, en)", pattern=r"^[a-z]{2}(-[A-Z]{2})?$"),
]
SlugPath = Annotated[str, Path(pattern=r"^[a-z0-9-]+$")]


@router.get("/languages/active", summary="Langues actives (EF-602)")
async def list_active_languages(
    db: Annotated[AsyncSession, Depends(get_session)],
) -> list[dict[str, Any]]:
    return await public_content.active_languages(db)


@router.get("/services-tree", summary="Arbre complet des services (EF-101)")
async def get_services_tree(
    db: Annotated[AsyncSession, Depends(get_session)],
    lang: LangQuery = None,
    if_none_match: Annotated[str | None, Header(alias="If-None-Match")] = None,
) -> Response:
    requested, default = await public_content.resolve_lang(db, lang)
    payload = await public_content.services_tree(db, lang=requested, default_lang=default)
    serialized = json.dumps(jsonable_encoder(payload), sort_keys=True)
    etag = f'"{hashlib.sha256(serialized.encode()).hexdigest()}"'
    if if_none_match == etag:
        return Response(status_code=304, headers={"ETag": etag})
    return JSONResponse(content=jsonable_encoder(payload), headers={"ETag": etag})


@router.get("/familles/{slug}", summary="Détail d'une famille de services")
async def get_family(
    db: Annotated[AsyncSession, Depends(get_session)],
    slug: SlugPath,
    lang: LangQuery = None,
) -> dict[str, Any]:
    requested, default = await public_content.resolve_lang(db, lang)
    return await public_content.family_detail(db, slug=slug, lang=requested, default_lang=default)


@router.get("/domains/{slug}", summary="Détail d'un domaine (EF-102)")
async def get_domain(
    db: Annotated[AsyncSession, Depends(get_session)],
    slug: SlugPath,
    lang: LangQuery = None,
) -> dict[str, Any]:
    requested, default = await public_content.resolve_lang(db, lang)
    return await public_content.domain_detail(db, slug=slug, lang=requested, default_lang=default)


@router.get("/sectors", summary="Univers et sous-catégories (EF-104)")
async def list_sectors(
    db: Annotated[AsyncSession, Depends(get_session)],
    lang: LangQuery = None,
) -> list[dict[str, Any]]:
    requested, default = await public_content.resolve_lang(db, lang)
    return await public_content.sectors(db, lang=requested, default_lang=default)


@router.get("/intervention-types", summary="Types d'intervention (EF-103)")
async def list_intervention_types(
    db: Annotated[AsyncSession, Depends(get_session)],
    lang: LangQuery = None,
) -> list[dict[str, Any]]:
    requested, default = await public_content.resolve_lang(db, lang)
    return await public_content.intervention_types(db, lang=requested, default_lang=default)


@router.get("/offices", summary="Bureaux et implantations (EF-106)")
async def list_offices(
    db: Annotated[AsyncSession, Depends(get_session)],
    lang: LangQuery = None,
) -> list[dict[str, Any]]:
    requested, default = await public_content.resolve_lang(db, lang)
    return await public_content.offices(db, lang=requested, default_lang=default)


@router.get("/team", summary="Équipe et fondateur (EF-107)")
async def list_team(
    db: Annotated[AsyncSession, Depends(get_session)],
    lang: LangQuery = None,
) -> list[dict[str, Any]]:
    requested, default = await public_content.resolve_lang(db, lang)
    return await public_content.team(db, lang=requested, default_lang=default)


@router.get("/publications", summary="Publications publiées (EF-105)")
async def list_publications(
    db: Annotated[AsyncSession, Depends(get_session)],
    lang: LangQuery = None,
    cursor: str | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
    category: str | None = None,
) -> dict[str, Any]:
    requested, default = await public_content.resolve_lang(db, lang)
    return await public_content.publications(
        db,
        lang=requested,
        default_lang=default,
        cursor=cursor,
        limit=limit,
        category=category,
    )


@router.get("/publications/{slug}", summary="Détail d'une publication (EF-105)")
async def get_publication(
    db: Annotated[AsyncSession, Depends(get_session)],
    slug: SlugPath,
    lang: LangQuery = None,
) -> dict[str, Any]:
    requested, default = await public_content.resolve_lang(db, lang)
    return await public_content.publication_detail(
        db, slug=slug, lang=requested, default_lang=default
    )


@router.get("/pages/{key}", summary="Page éditoriale et sections (EF-107/108)")
async def get_page(
    db: Annotated[AsyncSession, Depends(get_session)],
    key: str,
    lang: LangQuery = None,
) -> dict[str, Any]:
    requested, default = await public_content.resolve_lang(db, lang)
    return await public_content.page_detail(db, key=key, lang=requested, default_lang=default)


@router.get("/settings/public", summary="Coordonnées, identité et SEO (EF-106)")
async def get_public_settings(
    db: Annotated[AsyncSession, Depends(get_session)],
    lang: LangQuery = None,
) -> dict[str, Any]:
    requested, default = await public_content.resolve_lang(db, lang)
    return await public_content.public_settings(db, lang=requested, default_lang=default)


@router.get("/search", summary="Recherche plein texte (EF-201..204)")
async def search(
    db: Annotated[AsyncSession, Depends(get_session)],
    q: Annotated[str, Query(min_length=2, max_length=120)],
    lang: LangQuery = None,
) -> dict[str, Any]:
    requested, default = await public_content.resolve_lang(db, lang)
    return await public_content.search(db, query=q, lang=requested, default_lang=default)
