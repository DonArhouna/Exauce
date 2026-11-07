"""Payload deterministe du seed — construit a partir des exports JSON figes.

Sources (aucune valeur inventee) :
- `data/content_data.json` : arborescence des services, secteurs, interventions,
  categories, publications, bureaux, ORGANISATION (doc 13 §4) ;
- `data/editorial_i18n.json` : 126 cles editoriales doc 15 avec valeurs FR/EN ;
- `data/section_types.json` : catalogue doc 16 §3.1/§3.4 (21 codes) ;
- constantes ci-dessous : tables de la doc 13 §1.6 (PAGE_SLUGS), doc 06 §6.2
  (seed + redirections + rôles), doc 03 (libellés d'acteurs).

`build_payload(with_demo=...)` est pur (aucune base) : `app.seed.run` applique
le payload en upserts idempotents par `source_key` / clé naturelle.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from app.seed.slug import SlugRegistry, SourceKeyRegistry, slugify

DATA_DIR = Path(__file__).resolve().parent / "data"
LANGS: tuple[str, str] = ("fr", "en")

# --- Langues (doc 06 §6.2 point 1 ; libelle FR exemple doc 06 L491) ---------
LANGUAGES: tuple[dict[str, Any], ...] = (
    {"code": "fr", "label": "Français", "is_default": True, "sort_order": 1},
    {"code": "en", "label": "English", "is_default": False, "sort_order": 2},
)

# --- Pages : doc 13 §1.6 (PAGE_SLUGS) + doc 06 §6.2 points 4 ---------------
# (page_key, template, is_in_nav, nav_position, is_system, status, banners_pending)
PAGES: tuple[tuple[str, str, bool, int | None, bool, str, bool], ...] = (
    # nav_position home = 0 : doc 13 range home en « logo » avant 1..6 (convention).
    ("home", "home", True, 0, True, "published", False),
    ("services", "standard", True, 1, False, "published", False),
    ("interventions", "standard", True, 2, False, "published", False),
    ("sectors", "standard", True, 3, False, "published", False),
    ("publications", "standard", True, 4, False, "published", False),
    ("about", "standard", True, 5, False, "published", False),
    ("contact", "contact", True, 6, False, "published", False),
    ("legal_notice", "legal", False, None, True, "draft", True),
    ("client_area", "coming_soon", False, None, False, "published", False),
    ("not_found", "coming_soon", False, None, True, "published", False),
)

# Slugs doc 13 §1.6 (col FR/EN) ; not_found sans slug (doc 13 L136).
PAGE_SLUGS: dict[str, dict[str, str | None]] = {
    "home": {"fr": "", "en": ""},
    "services": {"fr": "services", "en": "services"},
    "interventions": {"fr": "interventions", "en": "interventions"},
    "sectors": {"fr": "secteurs", "en": "sectors"},
    "publications": {"fr": "publications", "en": "publications"},
    "about": {"fr": "a-propos", "en": "about-us"},
    "contact": {"fr": "contact", "en": "contact"},
    "legal_notice": {"fr": "mentions-legales", "en": "legal-notice"},
    "client_area": {"fr": "espace-client", "en": "customer-area"},
    "not_found": {"fr": None, "en": None},
}

# --- Les 29 blocs : doc 06 §6.2 point 6 + doc 15 (cles) + ordre frontend ---
# (page_key, source_key, section_type) — position = rang dans la page (1..N).
SECTION_INSTANCES: tuple[tuple[str, str, str], ...] = (
    ("home", "hero", "hero"),
    ("home", "trust_bar", "trust_bar"),
    ("home", "about_preview", "about_preview"),
    ("home", "domains_grid", "domains_grid"),
    ("home", "audit_grid", "audit_grid"),
    ("home", "interventions_grid", "interventions_grid"),
    ("home", "sectors_grid", "sectors_grid"),
    ("home", "stats", "stats"),
    ("home", "publications_grid", "publications_grid"),
    ("home", "cta", "cta"),
    ("services", "header", "page_header"),
    ("services", "modes", "modes"),
    ("services", "domains_grid", "domains_grid"),
    ("services", "audit_grid", "audit_grid"),
    ("services", "cta", "cta"),
    ("interventions", "header", "page_header"),
    ("interventions", "compare", "interventions_compare"),
    ("about", "header", "page_header"),
    ("about", "what_we_do", "what_we_do"),
    ("about", "how_we_work", "steps"),
    ("about", "values", "values_grid"),
    ("about", "founder_card", "founder_card"),
    ("publications", "header", "page_header"),
    ("contact", "contact_form", "contact_form"),  # position 1 (doc 16 §3.4)
    ("contact", "offices_grid", "offices_grid"),  # position 2 (doc 16 §3.4)
    ("client_area", "coming_soon", "coming_soon"),
    ("legal_notice", "mentions", "legal_document"),
    ("legal_notice", "privacy", "legal_document"),
    ("legal_notice", "cookies", "legal_document"),
)

# --- Redirections initiales (doc 06 §6.2 point 15, Q-103/A1) ---------------
REDIRECTS: tuple[tuple[str, str, str], ...] = (
    ("/fr/localisations", "/fr/contact#implantations", "fr"),
    ("/en/locations", "/en/contact#implantations", "en"),
    ("/fr/locations", "/fr/contact#implantations", "fr"),
    ("/en/localisations", "/en/contact#implantations", "en"),
)

# --- Roles (codes doc 06 L656 ; libellés = acteurs doc 03 §1) --------------
# `viewer` : aucun acteur doc 03 — « Lecteur » derive de doc 01 (a confirmer).
ROLES: tuple[tuple[str, str], ...] = (
    ("super_admin", "Super-admin"),
    ("admin", "Administrateur"),
    ("editor", "Rédacteur"),
    ("reviewer", "Relecteur"),
    ("crm", "Chargé de relation clients"),
    ("viewer", "Lecteur"),
)

# --- Compte fondateur (doc 06 §6.2 point 13, Q-105/U1) ---------------------
# email/display_name : valeurs du mock Backoffice + persona doc 01 (a confirmer) ;
# aucun mot de passe n'est semé (jamais de cle en clair).
FOUNDER: dict[str, Any] = {
    "email": "fondateur@exauceac.com",
    "display_name": "Assane KANE",
    "password_hash": None,
    "is_active": True,
    "mfa_active": False,
    "must_reset_password": True,
    "default_lang": "fr",
    "roles": ("super_admin",),
}

# --- Comptes de démo (doc 06 §6.2 point 17, Q-104) -------------------------
# Uniquement avec --with-demo, jamais en production. Sans mot de passe :
# activation par invitation signée (MailHog en dev). (email_local, rôle, libellé).
DEMO_USERS: tuple[tuple[str, str, str], ...] = (
    ("demo-admin", "admin", "Administrateur"),
    ("demo-editor", "editor", "Rédacteur"),
    ("demo-reviewer", "reviewer", "Relecteur"),
    ("demo-crm", "crm", "Chargé de relation clients"),
    ("demo-viewer", "viewer", "Lecteur"),
)

# --- Matrice de permissions (doc 10 §2 lignes 27-48 + décisions 2026-11-03) -
# module -> (actions, langue_scopable) ; scopable => 2 permissions (fr, en).
PERMISSIONS_MATRIX: dict[str, tuple[tuple[str, ...], bool]] = {
    "pages": (("view", "create", "edit", "review", "publish", "delete"), True),
    "tree": (("view", "create", "edit", "move", "merge", "delete"), True),
    "publications": (("view", "create", "edit", "review", "publish", "delete"), True),
    "media": (("view", "create", "edit", "delete"), False),
    "leads": (("view", "edit", "status", "notes", "export", "anonymize"), False),
    "clients": (("view", "create", "edit", "delete", "upload"), False),
    "users": (("view", "create", "edit", "delete", "deactivate"), False),
    "languages": (("view", "activate", "deactivate"), False),
    "offices": (("view", "create", "edit", "delete", "deactivate"), True),
    "team": (("view", "create", "edit", "delete", "deactivate"), True),
    "settings": (("view", "edit"), True),
    "seo": (("view", "create", "edit", "delete"), True),
    "audit": (("view", "export"), False),
    "backup": (("view", "run"), False),
}

#: rôle -> {module: actions ou None = toutes les actions du module}.
#: Décisions 2026-11-03 (page 10 §2), complétées le 2026-11-07 : super_admin =
#: tout ; admin = ses 11 modules (9 + media + leads) ; editor/reviewer =
#: répartition pages+tree+publications+media (editor sans delete média) ;
#: crm = leads+clients ; viewer = aucune permission.
ROLE_PERMISSIONS: dict[str, dict[str, tuple[str, ...] | None]] = {
    "super_admin": dict.fromkeys(PERMISSIONS_MATRIX),
    "admin": {
        "pages": ("publish",),
        "tree": None,
        "publications": ("publish",),
        "media": None,
        "leads": None,
        "users": None,
        "offices": None,
        "team": None,
        "settings": None,
        "seo": None,
        "audit": None,
    },
    "editor": {
        "pages": ("view", "create", "edit", "delete"),
        "tree": ("view", "create", "edit"),
        "publications": ("view", "create", "edit", "delete"),
        "media": ("view", "create", "edit"),
    },
    "reviewer": {
        "pages": ("view", "review"),
        "publications": ("view", "review"),
    },
    "crm": {"leads": None, "clients": None},
    "viewer": {},
}

# --- Registre des groupes de settings traduisibles (doc 16 §9) -------------
# Seuls les settings a valeur documentee sont semes (doc 06 §6.2 point 14) ;
# les setting_keys de contact/seo/retention/features sont absentes des docs.
SETTINGS_TRANSLATABLE: dict[str, bool] = {
    "ui_copy": True,
    "cookies": True,
    "identity": False,
}

# Notation doc 15 `team_members.founder.*` vs code doc 06 `fondateur`.
TEAM_MEMBER_ALIASES: dict[str, str] = {"founder": "fondateur"}

_JSON_SCHEMA = "https://json-schema.org/draft/2020-12/schema"


@dataclass
class SeedPayload:
    """Tout ce que le seed insere, dans l'ordre des dependances FK."""

    languages: list[dict[str, Any]] = field(default_factory=list)
    section_types: list[dict[str, Any]] = field(default_factory=list)
    roles: list[dict[str, Any]] = field(default_factory=list)
    pages: list[dict[str, Any]] = field(default_factory=list)
    nodes: list[dict[str, Any]] = field(default_factory=list)
    sections: list[dict[str, Any]] = field(default_factory=list)
    sectors: list[dict[str, Any]] = field(default_factory=list)
    intervention_types: list[dict[str, Any]] = field(default_factory=list)
    categories: list[dict[str, Any]] = field(default_factory=list)
    offices: list[dict[str, Any]] = field(default_factory=list)
    team_members: list[dict[str, Any]] = field(default_factory=list)
    settings: list[dict[str, Any]] = field(default_factory=list)
    publications: list[dict[str, Any]] = field(default_factory=list)
    redirects: list[dict[str, Any]] = field(default_factory=list)
    founder: dict[str, Any] = field(default_factory=dict)
    demo_users: list[dict[str, Any]] = field(default_factory=list)
    permissions: list[dict[str, Any]] = field(default_factory=list)
    role_permissions: list[dict[str, Any]] = field(default_factory=list)
    editorial_targets: int = 0
    editorial_keys: int = 0


def _load(name: str) -> dict[str, Any]:
    return json.loads((DATA_DIR / name).read_text(encoding="utf-8"))


def _split_token(part: str) -> tuple[str, str | None]:
    """`items[onecca]` -> (`items`, `onecca`) ; `title` -> (`title`, None)."""
    if "[" in part:
        name, _, rest = part.partition("[")
        return name, rest.rstrip("]")
    return part, None


def _set_path(data: dict[str, Any], path: str, value: Any) -> None:
    """Ecrit `value` dans une structure JSONB imbriquee (`items[cle].champ`)."""
    parts = path.split(".")
    current: Any = data
    for index, part in enumerate(parts):
        name, key = _split_token(part)
        last = index == len(parts) - 1
        if key is None:
            if last:
                current[name] = value
                continue
            nxt = current.get(name)
            if not isinstance(nxt, dict):
                nxt = {}
                current[name] = nxt
            current = nxt
            continue
        container = current.get(name)
        if key.isdigit():
            if not isinstance(container, list):
                container = []
                current[name] = container
            position = int(key)
            while len(container) <= position:
                container.append({})
            if last:
                container[position] = value
                continue
            sub = container[position]
            if not isinstance(sub, dict):
                sub = {}
                container[position] = sub
            current = sub
        else:
            if not isinstance(container, dict):
                container = {}
                current[name] = container
            if last:
                container[key] = value
                continue
            sub = container.get(key)
            if not isinstance(sub, dict):
                sub = {}
                container[key] = sub
            current = sub


def _translation(slug: str | None, status: str) -> dict[str, Any]:
    return {"slug": slug, "status": status, "data": {}}


def _build_section_types(raw: dict[str, Any]) -> list[dict[str, Any]]:
    """Schemas derives des champs doc 16 §3.4 (libelles = noms documentes)."""
    built: list[dict[str, Any]] = []
    for entry in raw["types"]:
        properties: dict[str, Any] = {}
        composites: dict[str, dict[str, Any]] = {}
        for token in entry["translated_fields"]:
            match = re.fullmatch(r"([A-Za-z0-9_]+)\[\]\.([A-Za-z0-9_]+)", token)
            if match:
                node = composites.setdefault(
                    match.group(1), {"type": ["object", "array"], "properties": {}}
                )
                node["properties"][match.group(2)] = {"type": "string"}
            else:
                properties[token] = {"type": "string"}
        properties.update(composites)
        config_schema: dict[str, Any] = {
            "$schema": _JSON_SCHEMA,
            "type": "object",
            "properties": {},
            "additionalProperties": True,
        }
        if entry["config_note"]:
            # Champs de configuration en prose (doc 16 §3.1) : conserves en
            # description, noms exacts non documentes (pas d'invention).
            config_schema["description"] = entry["config_note"]
        built.append(
            {
                "code": entry["code"],
                # Libelles i18n back-office (doc 16 §3.4) : le code sert de
                # valeur de repli au seed.
                "label": entry["code"],
                "config_schema": config_schema,
                "translation_schema": {
                    "$schema": _JSON_SCHEMA,
                    "type": "object",
                    "properties": properties,
                    "additionalProperties": True,
                },
                "is_active": True,
            }
        )
    return built


def _build_pages() -> list[dict[str, Any]]:
    pages: list[dict[str, Any]] = []
    for page_key, template, in_nav, nav_pos, is_system, status, banners in PAGES:
        page_status = "draft" if status == "draft" else "published"
        pages.append(
            {
                "page_key": page_key,
                "template": template,
                "source_key": page_key,
                "is_in_nav": in_nav,
                "nav_position": nav_pos,
                "is_system": is_system,
                "status": status,
                "banners_pending": banners,
                "translations": {
                    lang: _translation(PAGE_SLUGS[page_key][lang], page_status) for lang in LANGS
                },
            }
        )
    return pages


def _build_sections() -> list[dict[str, Any]]:
    sections: list[dict[str, Any]] = []
    positions: dict[str, int] = {}
    for page_key, section_key, section_type in SECTION_INSTANCES:
        positions[page_key] = positions.get(page_key, 0) + 1
        status = "draft" if page_key == "legal_notice" else "published"
        sections.append(
            {
                "page_key": page_key,
                "source_key": section_key,
                "section_type": section_type,
                "position": positions[page_key],
                "is_active": True,
                "config": {},
                "translations": {lang: _translation(None, status) for lang in LANGS},
            }
        )
    return sections


def _build_settings(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Settings a valeur documentee — un par (group, setting_key) du doc 15."""
    settings: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for row in rows:
        if row["kind"] != "setting":
            continue
        if row["group"] == "legal":
            # E2 : groupe hors registre (doc 06 §6.2 / doc 16 §9) — la valeur
            # est reportee sur les sections legal_document par _apply_editorial.
            continue
        key = (row["group"], row["setting_key"])
        if key in seen:
            continue
        seen.add(key)
        translatable = SETTINGS_TRANSLATABLE.get(row["group"], False)
        settings.append(
            {
                "group_key": row["group"],
                "setting_key": row["setting_key"],
                "is_translatable": translatable,
                "value": {},
                "translations": (
                    {lang: _translation(None, "published") for lang in LANGS}
                    if translatable
                    else {}
                ),
            }
        )
    return settings


def _build_nodes(content: dict[str, Any]) -> list[dict[str, Any]]:
    """2 familles -> 10 domaines -> 20 groupes -> 94 prestations (doc 06 §6.2)."""
    nodes: list[dict[str, Any]] = []
    slugs = SlugRegistry()
    source_keys = SourceKeyRegistry()

    def add(
        node_type: str,
        source_key: str,
        parent: str | None,
        position: int,
        data: dict[str, dict[str, Any]],
        slug: dict[str, str],
    ) -> dict[str, Any]:
        entity: dict[str, Any] = {
            "node_type": node_type,
            "parent_source_key": parent,
            "position": position,
            "source_key": source_key,
            "status": "published",
            "translations": {lang: _translation(slug[lang], "published") for lang in LANGS},
        }
        for lang in LANGS:
            entity["translations"][lang]["data"] = dict(data[lang])
        nodes.append(entity)
        return entity

    for family in content["SERVICES"]:
        add(
            "family",
            family["id"],
            None,
            1,
            {
                lang: {
                    "title": family["title"][lang],
                    "intro": family["intro"][lang],
                    "tagline": family["tagline"][lang],
                }
                for lang in LANGS
            },
            family["slug"],
        )
        for d_index, domain in enumerate(family["domains"], 1):
            add(
                "domain",
                domain["id"],
                family["id"],
                d_index,
                {
                    lang: {"title": domain["title"][lang], "intro": domain["intro"][lang]}
                    for lang in LANGS
                },
                domain["slug"],
            )
            for g_index, group in enumerate(domain["groups"], 1):
                add(
                    "group",
                    group["id"],
                    domain["id"],
                    g_index,
                    {
                        lang: {
                            "title": group["title"][lang],
                            "intro": group["intro"][lang],
                        }
                        for lang in LANGS
                    },
                    group["slug"],
                )
                for s_index, item in enumerate(group["items"], 1):
                    # Slugs genres (doc 16 §7) : contexte groupe puis domaine.
                    slug_fr = slugs.unique(
                        "fr",
                        slugify(item["fr"]),
                        group_context=group["slug"]["fr"],
                        domain_context=domain["slug"]["fr"],
                    )
                    slug_en = slugs.unique(
                        "en",
                        slugify(item["en"]),
                        group_context=group["slug"]["en"],
                        domain_context=domain["slug"]["en"],
                    )
                    # source_key = {groupe}/{slug_fr} tronque 80 (doc 13 §2.1).
                    source_key = source_keys.unique(f"{group['id']}/{slug_fr}")
                    add(
                        "service",
                        source_key,
                        group["id"],
                        s_index,
                        {lang: {"title": item[lang]} for lang in LANGS},
                        {"fr": slug_fr, "en": slug_en},
                    )
    return nodes


def _build_sectors(content: dict[str, Any]) -> list[dict[str, Any]]:
    """3 univers + 9 sous-categories, approved=false (doc 06 §6.2 point 10)."""
    sectors: list[dict[str, Any]] = []
    for position, sector in enumerate(content["SECTORS"], 1):
        sectors.append(
            {
                "kind": "sector",
                "code": sector["id"],
                "source_key": sector["id"],
                "parent_code": None,
                "position": position,
                "approved": False,
                "translations": {
                    lang: _translation(sector["slug"][lang], "published") for lang in LANGS
                },
            }
        )
        for sub_position, sub in enumerate(sector["categories"], 1):
            sectors.append(
                {
                    "kind": "subcategory",
                    "code": sub["id"],
                    "source_key": sub["id"],
                    "parent_code": sector["id"],
                    "position": sub_position,
                    "approved": False,
                    "translations": {
                        lang: _translation(sub["slug"][lang], "published") for lang in LANGS
                    },
                }
            )
    return sectors


def _build_intervention_types(content: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "code": item["id"],
            "source_key": item["id"],
            "sort_order": position,
            "translations": {lang: _translation(item["slug"][lang], "published") for lang in LANGS},
        }
        for position, item in enumerate(content["INTERVENTIONS"], 1)
    ]


def _build_categories(content: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "code": code,
            "source_key": code,
            "position": position,
            # slug = code dans les deux langues (filtres d'URL, doc 06 §2.2).
            "translations": {lang: _translation(code, "published") for lang in LANGS},
        }
        for position, code in enumerate(content["PUBLICATION_CATEGORIES"], 1)
    ]


def _build_offices(content: dict[str, Any]) -> list[dict[str, Any]]:
    org = content["ORGANIZATION"]
    return [
        {
            "code": "hq",
            "source_key": "hq",
            "is_headquarters": True,
            "is_active": True,
            "position": 1,
            "phone_fixed": org["phoneFixed"],
            "phone_mobile": org["phoneMobile"],
            "email": org["email"],
            "translations": {lang: _translation(None, "published") for lang in LANGS},
        }
    ]


def _build_team_members() -> list[dict[str, Any]]:
    return [
        {
            "code": "fondateur",
            "source_key": "fondateur",
            "is_founder": True,
            "is_active": True,
            "position": 1,
            "translations": {lang: _translation(None, "published") for lang in LANGS},
        }
    ]


def _build_publications(content: dict[str, Any]) -> list[dict[str, Any]]:
    """3 publications « Exemple » (Q-104) — uniquement avec --with-demo."""
    publications: list[dict[str, Any]] = []
    for pub in content["PUBLICATIONS_MOCK"]:
        publications.append(
            {
                "source_key": pub["id"],
                "category": pub["category"],
                "status": "draft",
                "published_at": pub["date"],
                # author_id reste NULL (Q-105) : variante data.author_name (doc 13) ;
                # seul pub-1 porte un `author` dans le frontend.
                "author_name": pub.get("author"),
                "translations": {lang: _translation(pub["slug"][lang], "draft") for lang in LANGS},
            }
        )
    return publications


def _apply_editorial(rows: list[dict[str, Any]], payload: SeedPayload) -> None:
    """Ecrit les 127 cibles du doc 15 dans les structures du payload."""
    page_index = {p["page_key"]: p for p in payload.pages}
    section_index = {(s["page_key"], s["source_key"]): s for s in payload.sections}
    setting_index = {(s["group_key"], s["setting_key"]): s for s in payload.settings}
    office_index = {o["source_key"]: o for o in payload.offices}
    team_index = {t["source_key"]: t for t in payload.team_members}
    itype_index = {i["code"]: i for i in payload.intervention_types}
    cat_index = {c["code"]: c for c in payload.categories}
    node_index = {n["source_key"]: n for n in payload.nodes}

    legal_sections = [s for s in payload.sections if s["page_key"] == "legal_notice"]

    for row in rows:
        kind = row["kind"]
        if kind == "setting":
            if row["group"] == "legal":
                # Ecart doc 15 vs doc 16 §3.4 : `site_settings.legal.*` est
                # hors registre (doc 06 §6.2/16 §9). `banner_text` est un champ
                # traduit du type legal_document (doc 16 §3.4) -> reporte sur
                # les 3 blocs legaux, sans creer de groupe « legal ».
                for section in legal_sections:
                    for lang in LANGS:
                        section["translations"][lang]["data"]["banner_text"] = row[lang]
                continue
            setting = setting_index.get((row["group"], row["setting_key"]))
            if setting is None:
                raise ValueError(f"cible editoriale inconnue : {row['key']}")
            if setting["is_translatable"]:
                for lang in LANGS:
                    setting["translations"][lang]["data"]["value"] = row[lang]
            else:
                setting["value"] = {"value": row["fr"]}
            continue

        entity: dict[str, Any] | None = None
        if kind == "page":
            entity = page_index.get(row["page"])
        elif kind == "page_section":
            entity = section_index.get((row["page"], row["section"]))
        elif kind == "office":
            entity = office_index.get(row["entity_key"])
        elif kind == "team_member":
            mapped = TEAM_MEMBER_ALIASES.get(row["entity_key"], row["entity_key"])
            entity = team_index.get(mapped)
        elif kind == "interventiontype":
            entity = itype_index.get(row["entity_key"])
        elif kind == "category":
            entity = cat_index.get(row["entity_key"])
        elif kind == "node":
            entity = node_index.get(row["entity_key"])
        if entity is None:
            raise ValueError(f"cible editoriale inconnue : {row['key']} -> {row}")

        for lang in LANGS:
            value: Any = row[lang]
            if kind == "office" and row["field"] == "address_lines":
                # doc 16 §4 : address_lines est une liste de lignes.
                value = [value]
            _set_path(entity["translations"][lang]["data"], row["field"], value)


def _apply_base(payload: SeedPayload, content: dict[str, Any]) -> None:
    """Valeurs frontend (content.data.ts) — font foi la ou les sources se croisent."""
    # Bureau : nom et ville viennent d'OFFICES (doc 13 §1.1) ; la double cible
    # `data.city` du doc 15 (valeur « Dakar, Sénégal ») est ecrasee ici.
    office = payload.offices[0]
    frontend_office = content["OFFICES"][0]
    for lang in LANGS:
        data = office["translations"][lang]["data"]
        data["name"] = frontend_office["name"][lang]
        data["city"] = frontend_office["city"][lang]

    itype_by_code = {i["code"]: i for i in payload.intervention_types}
    for item in content["INTERVENTIONS"]:
        entity = itype_by_code[item["id"]]
        for lang in LANGS:
            data = entity["translations"][lang]["data"]
            data["title"] = item["title"][lang]
            data["intro"] = item["intro"][lang]

    sector_by_code = {s["code"]: s for s in payload.sectors}
    for sector in content["SECTORS"]:
        entity = sector_by_code[sector["id"]]
        for lang in LANGS:
            data = entity["translations"][lang]["data"]
            data["title"] = sector["title"][lang]
            data["intro"] = sector["intro"][lang]
        for sub in sector["categories"]:
            sub_entity = sector_by_code[sub["id"]]
            for lang in LANGS:
                sub_entity["translations"][lang]["data"]["title"] = sub["title"][lang]

    pub_by_key = {p["source_key"]: p for p in payload.publications}
    for pub in content["PUBLICATIONS_MOCK"]:
        pub_entity = pub_by_key.get(pub["id"])
        if pub_entity is None:
            continue
        for lang in LANGS:
            data = pub_entity["translations"][lang]["data"]
            data["title"] = pub["title"][lang]
            data["excerpt"] = pub["excerpt"][lang]
            if pub.get("author"):
                data["author_name"] = pub["author"]


def _build_permissions() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Registre `permissions` (95) + jonctions `role_permissions` (195)."""
    permissions: list[dict[str, Any]] = []
    for module, (actions, scopable) in PERMISSIONS_MATRIX.items():
        for action in actions:
            for lang in ("fr", "en") if scopable else (None,):
                permissions.append({"module": module, "action": action, "lang": lang})

    role_permissions: list[dict[str, Any]] = []
    for role_code, modules in ROLE_PERMISSIONS.items():
        for module, allowed in modules.items():
            module_actions = PERMISSIONS_MATRIX[module][0] if allowed is None else allowed
            scopable = PERMISSIONS_MATRIX[module][1]
            for action in module_actions:
                for lang in ("fr", "en") if scopable else (None,):
                    role_permissions.append(
                        {
                            "role_code": role_code,
                            "module": module,
                            "action": action,
                            "lang": lang,
                        }
                    )
    return permissions, role_permissions


def _build_demo_users() -> list[dict[str, Any]]:
    """Comptes de démo `--with-demo` uniquement — sans mot de passe (Q-104)."""
    return [
        {
            "email": f"{local}@exauceac.com",
            "display_name": label,
            "role": role,
            "password_hash": None,
            "must_reset_password": True,
        }
        for local, role, label in DEMO_USERS
    ]


def build_payload(*, with_demo: bool = False) -> SeedPayload:
    """Construit le payload complet ; `with_demo` ajoute les 3 publications."""
    content = _load("content_data.json")
    editorial = _load("editorial_i18n.json")
    section_types_raw = _load("section_types.json")
    rows: list[dict[str, Any]] = editorial["rows"]

    payload = SeedPayload(
        languages=[dict(lang) for lang in LANGUAGES],
        section_types=_build_section_types(section_types_raw),
        roles=[{"code": code, "label": label} for code, label in ROLES],
        pages=_build_pages(),
        sections=_build_sections(),
        settings=_build_settings(rows),
        offices=_build_offices(content),
        team_members=_build_team_members(),
        intervention_types=_build_intervention_types(content),
        categories=_build_categories(content),
        sectors=_build_sectors(content),
        publications=_build_publications(content) if with_demo else [],
        redirects=[
            {
                "old_path": old,
                "target_path": target,
                "status_code": 301,
                "auto_generated": False,  # redirections semees, pas auto-generees
                "lang": lang,
            }
            for old, target, lang in REDIRECTS
        ],
        founder=dict(FOUNDER),
        nodes=_build_nodes(content),
        demo_users=_build_demo_users() if with_demo else [],
    )
    payload.permissions, payload.role_permissions = _build_permissions()

    _apply_editorial(rows, payload)
    _apply_base(payload, content)

    payload.editorial_targets = len(rows)
    payload.editorial_keys = len({row["key"] for row in rows})
    return payload
