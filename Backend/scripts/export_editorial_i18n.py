"""Export JSON fige de l'inventaire i18n editorial (doc 15) pour le seed.

Parse le tableau de `Analyse/modelisation/docs/15-inventaire-contenu.md`,
ne garde que les lignes de classe « Éditorial », resout leurs valeurs dans
`fr.json` / `en.json` et produit `app/seed/data/editorial_i18n.json`.

Chaque ligne est : une cible en base (notation de la doc 15 section 0) et les
valeurs FR/EN. Aucune valeur n'est inventee : elles viennent des locales.

Usage :
    python scripts/export_editorial_i18n.py <doc15.md> <fr.json> <en.json> <out.json>
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


def lookup(data: dict[str, Any], dotted: str) -> Any:
    """Acces par chemin pointe ; retourne None si la cle n'existe pas."""
    current: Any = data
    for part in dotted.split("."):
        if not isinstance(current, dict) or part not in current:
            return None
        current = current[part]
    return current


def _resolve_notation(
    target: str, previous_page: str | None, previous_full: str | None
) -> str | None:
    """Resout le raccourci `...` de la doc 15 (section 0) vers une cible complete.

    Deux formes de raccourci `...` coexistent :
    - `...<section>.data.<champ>` : meme page, autre section ;
    - `...<champ>` (sans `.data.`) : meme entite, autre champ
      (`...` = cible precedente tronquee apres `.data.`).
    """
    if not target.startswith("..."):
        return target
    rest = target[3:]
    if ".data." in rest:
        if previous_page is None:
            return None
        return f"page_sections.{previous_page}.{rest}"
    if previous_full is None or ".data." not in previous_full:
        return None
    return f"{previous_full.split('.data.')[0]}.data.{rest}"


def _classify(target: str) -> tuple[str, dict[str, str]]:
    """Une cible resolue -> (kind, champs structures) ; kind '' si inconnue."""
    if target.startswith("page_sections."):
        parts = target.split(".")
        # page_sections.<page>.<section>.data.<champ...>
        if len(parts) < 5 or parts[3] != "data":
            return "", {}
        return "page_section", {"page": parts[1], "section": parts[2], "field": ".".join(parts[4:])}
    if target.startswith("pages."):
        parts = target.split(".")
        if len(parts) < 4 or parts[2] != "data":
            return "", {}
        return "page", {"page": parts[1], "field": ".".join(parts[3:])}
    if target.startswith("site_settings."):
        parts = target.split(".")
        if len(parts) != 3:
            return "", {}
        return "setting", {"group": parts[1], "setting_key": parts[2]}
    for prefix, kind in (
        ("content_nodes.", "node"),
        ("intervention_types.", "interventiontype"),
        ("sectors.", "sector"),
        ("categories.", "category"),
        ("offices.", "office"),
        ("team_members.", "team_member"),
    ):
        if target.startswith(prefix):
            rest = target[len(prefix) :].split(".")
            if len(rest) < 3 or rest[1] != "data":
                return "", {}
            return kind, {"entity_key": rest[0], "field": ".".join(rest[2:])}
    return "", {}


def parse_targets(
    target: str, previous_page: str | None, previous_full: str | None
) -> tuple[list[tuple[str, dict[str, str]]], str | None, str | None]:
    """Cellule « Cible » brute -> (cibles, previous_page, previous_full) mis a jour.

    La cellule peut contenir plusieurs cibles entre crochets (`a` + `b`) et
    des notes libres apres la premiere : seules les cibles sont retenues,
    plus les continuations `data.<champ>` (meme entite que la cible 1).
    """
    segments = re.findall(r"`([^`]+)`", target)
    if not segments:
        segments = [target.strip().strip("*")]
    results: list[tuple[str, dict[str, str]]] = []
    primary = _resolve_notation(segments[0], previous_page, previous_full)
    if primary is not None:
        kind, fields = _classify(primary)
        if kind:
            results.append((kind, fields))
            if kind == "page_section":
                previous_page = fields["page"]
    if not segments[0].startswith("..."):
        previous_full = segments[0]
    base = primary.split(".data.")[0] if primary and ".data." in primary else None
    for extra in segments[1:]:
        if extra.startswith("data.") and base is not None:
            kind, fields = _classify(f"{base}.{extra}")
            if kind:
                results.append((kind, fields))
    return results, previous_page, previous_full


def main() -> int:
    if len(sys.argv) != 5:
        print(__doc__)
        return 2
    doc15, fr_path, en_path, out_path = (Path(a) for a in sys.argv[1:])

    fr = json.loads(fr_path.read_text(encoding="utf-8"))
    en = json.loads(en_path.read_text(encoding="utf-8"))

    rows: list[dict[str, Any]] = []
    unparsed: list[str] = []
    counts = {"editorial": 0, "ui": 0, "technique": 0, "dead": 0, "other": 0}
    previous_page: str | None = None
    previous_full: str | None = None

    for raw in doc15.read_text(encoding="utf-8").splitlines():
        if not raw.startswith("| `"):
            continue
        cells = [c.strip() for c in raw.split("|")]
        if len(cells) < 5:
            continue
        key = cells[1].strip("`")
        classe = cells[3]
        if "Éditorial" in classe:
            counts["editorial"] += 1
        elif "UI" in classe:
            counts["ui"] += 1
        elif "technique" in classe.lower():
            counts["technique"] += 1
        elif "morte" in classe.lower():
            counts["dead"] += 1
        else:
            counts["other"] += 1
            continue
        if "Éditorial" not in classe:
            continue

        parsed, previous_page, previous_full = parse_targets(
            cells[4].strip("*"), previous_page, previous_full
        )
        if not parsed:
            unparsed.append(f"{key} -> {cells[4]}")
            continue

        value_fr = lookup(fr, key)
        value_en = lookup(en, key)
        for kind, fields in parsed:
            row: dict[str, Any] = {"key": key, "kind": kind, **fields}
            row["fr"] = value_fr
            row["en"] = value_en
            row["has_value"] = value_fr is not None and value_en is not None
            rows.append(row)

    payload = {
        "_source": "Analyse/modelisation/docs/15-inventaire-contenu.md + Frontend/src/i18n/locales",
        "stats": {"classes": counts, "editorial_rows": len(rows), "unparsed": len(unparsed)},
        "unparsed": unparsed,
        "rows": rows,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(f"{json.dumps(payload, ensure_ascii=False, indent=2)}\n", encoding="utf-8")

    print(f"editorial_rows={len(rows)} unparsed={len(unparsed)} classes={counts}")
    for item in unparsed:
        print(f"  UNPARSED {item}")
    missing = [r["key"] for r in rows if not r["has_value"]]
    print(f"sans_valeur={len(missing)}")
    for item in missing:
        print(f"  NOVALUE {item}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
