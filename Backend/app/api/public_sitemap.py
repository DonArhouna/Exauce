"""Sitemap XML public — `GET /sitemap.xml` (EF-701, doc 13 §6)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.db import get_session
from app.services.sitemap import build_sitemap_xml, collect_sitemap_entries

router = APIRouter(tags=["public-content"])


@router.get(
    "/sitemap.xml",
    response_class=Response,
    summary="Sitemap XML dynamique multi-langue (EF-701)",
)
async def get_sitemap_xml(
    db: Annotated[AsyncSession, Depends(get_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> Response:
    """Sitemap FR/EN : publications `published` uniquement (doc 13 §6)."""
    entries = await collect_sitemap_entries(db)
    xml = build_sitemap_xml(entries, base_url=settings.public_base_url)
    return Response(content=xml, media_type="application/xml")
