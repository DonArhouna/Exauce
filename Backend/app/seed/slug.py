"""Generation et unicite des slugs — algorithme doc 16 §7.

1. normalisation Unicode NFD, suppression des diacritiques, minuscules,
   remplacement de tout caractère non `[a-z0-9]` par `-`, compression des
   tirets, trim, troncature à 80 caractères ;
2. si le slug est libre -> retenu ;
3. sinon contextualisation par le groupe parent : `slug(base) + '-' + slug(groupe)` ;
4. sinon contextualisation par le domaine parent ;
5. sinon suffixe numérique `-2`, `-3`… ;
6. longueur finale ≤ 120 caractères ; jamais de slug vide.
"""

from __future__ import annotations

import re
import unicodedata

_BASE_MAX = 80
_FINAL_MAX = 120


def slugify(text: str) -> str:
    """Slug doc 16 §7.1 etape 1 : NFD, sans diacritiques, minuscules, tirets."""
    normalized = unicodedata.normalize("NFD", text)
    stripped = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    lowered = stripped.lower()
    dashed = re.sub(r"[^a-z0-9]+", "-", lowered)
    return dashed.strip("-")[:_BASE_MAX]


class SlugRegistry:
    """Registre d'unicite des slugs par langue (entity_type='node')."""

    def __init__(self) -> None:
        self._used: dict[str, set[str]] = {}

    def reserve(self, lang: str, slug: str) -> None:
        """Annule un slug fourni par le frontend (familles, domaines, groupes)."""
        self._used.setdefault(lang, set()).add(slug)

    def is_free(self, lang: str, slug: str) -> bool:
        return slug not in self._used.setdefault(lang, set())

    def unique(
        self,
        lang: str,
        base: str,
        *,
        group_context: str = "",
        domain_context: str = "",
    ) -> str:
        """Retourne le premier slug libre selon l'ordre doc 16 §7.1 (2→5)."""
        used = self._used.setdefault(lang, set())
        candidates: list[str] = [base]
        if group_context:
            candidates.append(f"{base}-{group_context}"[:_FINAL_MAX])
        if domain_context:
            candidates.append(f"{base}-{group_context}-{domain_context}"[:_FINAL_MAX])
        for candidate in candidates:
            if candidate and candidate not in used:
                used.add(candidate)
                return candidate
        # 5. suffixe numerique sur la forme la plus contextualisee disponible.
        stem = candidates[-1] if candidates else base
        suffix = 2
        while True:
            candidate = f"{stem}-{suffix}"[:_FINAL_MAX]
            if candidate not in used:
                used.add(candidate)
                return candidate
            suffix += 1


class SourceKeyRegistry:
    """Registre d'unicite des `source_key` (troncature 80, doc 13 §2.1)."""

    def __init__(self) -> None:
        self._used: set[str] = set()

    def unique(self, raw: str) -> str:
        """Tronque a 80 caracteres et resout les collisions par suffixe numerique."""
        candidate = raw[:80]
        suffix = 2
        while candidate in self._used:
            stem = raw[: 80 - len(str(suffix)) - 1]
            candidate = f"{stem}-{suffix}"
            suffix += 1
        self._used.add(candidate)
        return candidate
