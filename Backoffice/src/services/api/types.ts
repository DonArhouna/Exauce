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

// ── Demandes de contact ───────────────────────────────────────
/** Statuts d'une demande (contrat `leads.status`, doc 03). */
export type LeadStatus = 'new' | 'in_progress' | 'waiting' | 'done' | 'rejected' | 'anonymized';

/** Note interne attachée à une demande. */
export interface LeadNote {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
}

/** Ligne de liste : sans message ni notes, pour rester légère. */
export interface AdminLeadSummary {
  id: string;
  reference: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  sector: string | null;
  subject: string;
  source: string;
  status: LeadStatus;
  assigned_to_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminLeadDetail extends AdminLeadSummary {
  message: string;
  revision: number;
  notes: LeadNote[];
}

export interface LeadListQuery {
  status?: LeadStatus | 'all';
  search?: string;
  sector?: string;
  from?: string;
  to?: string;
  limit: number;
  offset: number;
}

/** Liste filtrée et compteurs par statut (onglets de l'écran). */
export interface LeadList {
  items: AdminLeadSummary[];
  total: number;
  counts: Record<LeadStatus, number>;
}

// ── Bureaux ────────────────────────────────────────────────────
/** Textes bilingues d'un bureau (résolus par `lang` côté public). */
export interface OfficeTranslation {
  name: string;
  city: string;
  address_lines: string[];
}

/**
 * Bureau du back-office. Contrairement à `Office` du contrat, les textes sont
 * exposés par langue : le mock accepte `translations` à l'écriture, écart
 * consigné dans `docs/mock-divergences.md`.
 */
export interface AdminOffice {
  id: string;
  code: string;
  position: number;
  is_headquarters: boolean;
  is_active: boolean;
  phone_fixed: string | null;
  phone_mobile: string | null;
  email: string | null;
  map_url: string | null;
  translations: Record<ContentLang, OfficeTranslation>;
}

/** Corps d'écriture commun à la création et à la modification. */
export interface OfficeWrite {
  code: string;
  position?: number;
  is_headquarters?: boolean;
  is_active?: boolean;
  phone_fixed?: string | null;
  phone_mobile?: string | null;
  email?: string | null;
  map_url?: string | null;
  translations: Record<ContentLang, OfficeTranslation>;
}

/** Réponse de `GET /admin/offices` dans le mock (le contrat renvoie un tableau). */
export interface OfficeList {
  items: AdminOffice[];
}
