import type { components } from './generated/schema';

/** Schémas générés depuis Analyse/modelisation/docs/openapi.yaml. */
export type Schemas = components['schemas'];

export type Problem = Schemas['Problem'];
export type Permission = Schemas['Permission'];
export type AdminSessionUser = Schemas['AdminSessionUser'];
export type AdminLoginRequest = Schemas['AdminLoginRequest'];
export type AdminLoginResponse = Schemas['AdminLoginResponse'];
export type AdminLoginAuthenticated = Schemas['AdminLoginAuthenticated'];
export type AdminLoginMfaRequired = Schemas['AdminLoginMfaRequired'];
export type AdminMeResponse = Schemas['AdminMeResponse'];
export type AdminActivateRequest = Schemas['AdminActivateRequest'];
export type AdminPasswordForgotRequest = Schemas['AdminPasswordForgotRequest'];
export type AdminPasswordResetRequest = Schemas['AdminPasswordResetRequest'];
export type AdminPasswordChangeRequest = Schemas['AdminPasswordChangeRequest'];
export type PublicationJob = Schemas['PublicationJob'];
export type PublicationJobList = Schemas['PublicationJobList'];
export type PublicationSiteStatus = Schemas['PublicationSiteStatus'];
export type AdminDashboard = Schemas['AdminDashboard'];
export type AdminNotification = Schemas['AdminNotification'];
export type AdminNotificationList = Schemas['AdminNotificationList'];
export type AuditEntry = Schemas['AuditEntry'];
export type LeadSummary = Schemas['LeadSummary'];

export type MediaItem = Schemas['MediaItem'];

/** Types de média acceptés par le contrat. */
export type MediaKind = NonNullable<MediaItem['kind']>;

/**
 * Réponse de `GET /admin/media` : enveloppe paginée déclarée en ligne dans le
 * contrat (pas de schéma nommé), d'où ce type local.
 */
export interface MediaList {
  items: MediaItem[];
  total: number;
}

// ── Pages et sections ──────────────────────────────────────────
/** Langues de contenu. */
export type ContentLang = 'fr' | 'en';

/** Statuts éditoriaux d'une page (workflow doc 16). */
export type PageStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'archived';

export type SectionValues = Record<string, unknown>;

/** Kinds rendus par le formulaire générique. */
export type SectionFieldKind = 'text' | 'textarea' | 'list';

export interface SectionField {
  key: string;
  kind: SectionFieldKind;
  labelKey: string;
  required?: boolean;
  maxLength?: number;
  itemFields?: SectionField[];
}

/** Type de section du registre (`section_types`), catalogue non exposé au contrat. */
export interface SectionTypeDef {
  code: string;
  labelKey: string;
  usage: string;
  editable: boolean;
  fields: SectionField[];
}

export interface SectionTypeList {
  items: SectionTypeDef[];
}

/**
 * Bloc d'une page. `data` est bilingue dans le mock : le contrat déclare un
 * objet plat, sans écriture par langue (voir `docs/mock-divergences.md`).
 */
export interface AdminSection {
  id: string;
  section_type: string;
  source_key: string | null;
  position: number;
  is_active: boolean;
  config: SectionValues;
  data: Record<ContentLang, SectionValues>;
}

export interface AdminPageSummary {
  id: string;
  page_key: string;
  template: string;
  is_in_nav: boolean;
  nav_position: number | null;
  is_system: boolean;
  status: PageStatus;
  title: Record<ContentLang, string>;
  section_count: number;
}

export interface AdminPageDetail extends AdminPageSummary {
  banners_pending: boolean;
  revision: number;
  slug: Record<ContentLang, string | null>;
  sections: AdminSection[];
}

export interface SectionMutation {
  page: AdminPageDetail;
  section: AdminSection;
}

export interface ProblemFieldError {
  field: string;
  message: string;
}
