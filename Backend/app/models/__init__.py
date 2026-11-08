"""Tous les modèles du CMS — importés ici pour s'enregistrer dans `Base.metadata`.

L'ordre d'import n'a pas d'importance : les FK sont résolues à la fin du module.
`alembic` et le seed importent `app.models` pour obtenir le schéma complet.
"""

from app.models.auth import (
    Consent,
    Invitation,
    LoginAttempt,
    Permission,
    Role,
    RolePermission,
    Session,
    User,
    UserRole,
)
from app.models.base import Base
from app.models.client import (
    ClientAccount,
    ClientDocument,
    ClientInvitation,
    ClientUser,
)
from app.models.content import (
    Category,
    ContentNode,
    InterventionType,
    Page,
    PageSection,
    Publication,
    SectionType,
    Sector,
)
from app.models.enums import (
    ActorType,
    ClientAccountStatus,
    ConsentType,
    EmailStatus,
    EntityType,
    LeadStatus,
    MediaKind,
    MediaStatus,
    NodeType,
    PageTemplate,
    RedirectStatus,
    SectorKind,
    SiteSettingGroup,
    TranslationStatus,
    WorkflowStatus,
)
from app.models.i18n import (
    ContentVersion,
    EntityTranslation,
    Language,
    Redirect,
    SearchSynonym,
)
from app.models.idempotency import IdempotencyKey
from app.models.leads import (
    AuditLog,
    Lead,
    LeadNote,
    Notification,
    OutboxEmail,
)
from app.models.media import Media, MediaRef, MediaVariant
from app.models.partners import Partner
from app.models.site import Office, SiteSetting, TeamMember

__all__ = [
    "ActorType",
    "AuditLog",
    "Base",
    "Category",
    "ClientAccount",
    "ClientAccountStatus",
    "ClientDocument",
    "ClientInvitation",
    "ClientUser",
    "Consent",
    "ConsentType",
    "ContentNode",
    "ContentVersion",
    "EmailStatus",
    "EntityTranslation",
    "EntityType",
    "IdempotencyKey",
    "InterventionType",
    "Invitation",
    "Language",
    "Lead",
    "LeadNote",
    "LeadStatus",
    "LoginAttempt",
    "Media",
    "MediaKind",
    "MediaRef",
    "MediaStatus",
    "MediaVariant",
    "Notification",
    "NodeType",
    "Office",
    "OutboxEmail",
    "Page",
    "PageSection",
    "PageTemplate",
    "Partner",
    "Permission",
    "Publication",
    "Redirect",
    "RedirectStatus",
    "Role",
    "RolePermission",
    "SearchSynonym",
    "Sector",
    "SectorKind",
    "SectionType",
    "Session",
    "SiteSetting",
    "SiteSettingGroup",
    "TeamMember",
    "TranslationStatus",
    "User",
    "UserRole",
    "WorkflowStatus",
]
