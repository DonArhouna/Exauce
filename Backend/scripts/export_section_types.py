"""Export JSON fige du catalogue section_types (doc 16 §3.1 + §3.4) pour le seed.

Parse deux tableaux de `Analyse/modelisation/docs/16-modele-editorial.md` :
- §3.4 : Code | Usage | Champs traduits (indicatifs)  -> registre (21 codes)
- §3.1 : Section | Champs éditoriaux | Champs de configuration -> notes

Produit `app/seed/data/section_types.json`. Aucune valeur inventee : les
libelles de champs viennent du doc, la traduction du texte des locales.

Usage :
    python scripts/export_section_types.py <doc16.md> <out.json>
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__)
        return 2
    doc16, out_path = (Path(a) for a in sys.argv[1:])

    mode: str | None = None
    catalog: list[dict[str, Any]] = []
    config_notes: dict[str, tuple[str, str]] = {}

    for line in doc16.read_text(encoding="utf-8").splitlines():
        if line.startswith("### 3.1"):
            mode = "config"
            continue
        if line.startswith("### 3.4"):
            mode = "catalog"
            continue
        if line.startswith("## ") or line.startswith("### "):
            mode = None
            continue
        if mode is None or not line.startswith("| `"):
            continue
        cells = [c.strip() for c in line.split("|")]
        if len(cells) < 5:
            continue
        code = cells[1].strip("`")
        if mode == "config":
            config_notes[code] = (cells[2], cells[3])
        else:
            catalog.append(
                {
                    "code": code,
                    "usage": cells[2],
                    "translated_raw": cells[3],
                    "translated_fields": re.findall(r"`([^`]+)`", cells[3]),
                }
            )

    for entry in catalog:
        editorial_note, config_note = config_notes.get(entry["code"], ("", ""))
        entry["editorial_note"] = editorial_note
        entry["config_note"] = config_note

    payload = {
        "_source": "Analyse/modelisation/docs/16-modele-editorial.md (sections 3.1 et 3.4)",
        "count": len(catalog),
        "types": catalog,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(f"{json.dumps(payload, ensure_ascii=False, indent=2)}\n", encoding="utf-8")
    print(f"section_types={len(catalog)}")
    for entry in catalog:
        print(f"  {entry['code']}: {entry['translated_fields']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
