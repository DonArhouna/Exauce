"""Énumérations et constantes métier — alignées sur doc 06 (dictionnaire) et doc 16.

Les valeurs sont les identifiants **stables** stockés en base (jamais les libellés
traduits). Les CHECK constraints en base reprennent ces ensembles.
"""

from __future__ import annotations

import enum


class StrEnum(enum.StrEnum):
    """Enum dont la valeur est la chaîne persistée (utile pour les CHECK)."""


class WorkflowStatus(StrEnum):
    """Statut éditorial commun (content_nodes, pages, publications, traductions)."""

    DRAFT = "draft"
    IN_REVIEW = "in_review"
    PUBLISHED = "published"
    STALE = "stale"


class TranslationStatus(StrEnum):
    """Statut d'une traduction — inclut `missing` (non fournie)."""

    MISSING = "missing"
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    PUBLISHED = "published"
    STALE = "stale"


class NodeType(StrEnum):
    """Type de nœud de l'arborescence des services (4 niveaux, ADR-002)."""

    FAMILY = "family"
    DOMAIN = "domain"
    GROUP = "group"
    SERVICE = "service"


class PageTemplate(StrEnum):
    """Gabarit de rendu attendu par le frontend pour une page."""

    HOME = "home"
    STANDARD = "standard"
    LEGAL = "legal"
    CONTACT = "contact"
    COMING_SOON = "coming_soon"


class EntityType(StrEnum):
    """Registre fermé des entités transposables (contrainte `entity_translations`)."""

    NODE = "node"
    PAGE = "page"
    PAGE_SECTION = "page_section"
    PUBLICATION = "publication"
    CATEGORY = "category"
    MEDIA = "media"
    SETTING = "setting"
    INTERVENTIONTYPE = "interventiontype"
    SECTOR = "sector"
    OFFICE = "office"
    TEAM_MEMBER = "team_member"
    PARTNER = "partner"


#: Vocabulaire `permissions.module` (registre aligné sur la page 10).
PERMISSION_MODULES = frozenset(
    {
        "pages",
        "tree",
        "publications",
        "media",
        "leads",
        "clients",
        "users",
        "languages",
        "offices",
        "team",
        "settings",
        "seo",
        "audit",
        "backup",
    }
)

#: Vocabulaire `permissions.action`.
PERMISSION_ACTIONS = frozenset(
    {
        "view",
        "create",
        "edit",
        "review",
        "publish",
        "delete",
        "export",
        "move",
        "merge",
        "deactivate",
    }
)

#: Rôles semés par le seed (doc 06 §2.3).
SEEDED_ROLE_CODES = ("super_admin", "admin", "editor", "reviewer", "crm", "viewer")


class RedirectStatus(StrEnum):
    """Code HTTP d'une redirection (301 par défaut — Q-103/A1)."""

    PERMANENT = "301"
    TEMPORARY = "302"


class LeadStatus(StrEnum):
    """Workflow de traitement d'un lead (contact)."""

    NEW = "new"
    IN_PROGRESS = "in_progress"
    WAITING = "waiting"
    DONE = "done"
    REJECTED = "rejected"
    ANONYMIZED = "anonymized"


class MediaKind(StrEnum):
    """Type de média."""

    IMAGE = "image"
    PDF = "pdf"
    DOCUMENT = "document"


class MediaStatus(StrEnum):
    """Cycle de vie d'un média."""

    ACTIVE = "active"
    REPLACED = "replaced"
    DELETED = "deleted"


class SectorKind(StrEnum):
    """`sectors.kind` : univers (sector) ou sous-catégorie (subcategory)."""

    SECTOR = "sector"
    SUBCATEGORY = "subcategory"


class ActorType(StrEnum):
    """`audit_log.actor_type`."""

    USER = "user"
    SYSTEM = "system"


class ConsentType(StrEnum):
    """`consents.consent_type` (conformité CDP / loi 2008-12)."""

    COOKIES = "cookies"
    FORMS = "forms"


class EmailStatus(StrEnum):
    """`outbox_emails.status`."""

    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    ABANDONED = "abandoned"


class ClientAccountStatus(StrEnum):
    """`client_accounts.status` (espace client v2)."""

    INVITED = "invited"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    ARCHIVED = "archived"


class SiteSettingGroup(StrEnum):
    """Registre des groupes de paramètres du site (`site_settings.group_key`)."""

    IDENTITY = "identity"
    CONTACT = "contact"
    COOKIES = "cookies"
    UI_COPY = "ui_copy"
    FEATURES = "features"
    SEO = "seo"
    RETENTION = "retention"
