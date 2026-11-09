import { apiRequest } from '../client';
import type {
  AdminPageDetail,
  AdminPageSummary,
  ContentLang,
  PageStatus,
  SectionMutation,
  SectionTypeList,
  SectionValues,
} from '../types';

/** `GET /admin/pages` — liste des pages éditoriales. */
export async function listPages(): Promise<AdminPageSummary[]> {
  return apiRequest<AdminPageSummary[]>('/admin/pages');
}

/** `GET /admin/pages/{id}` — page et blocs ordonnés. */
export async function getPage(id: string): Promise<AdminPageDetail> {
  return apiRequest<AdminPageDetail>(`/admin/pages/${encodeURIComponent(id)}`);
}

/**
 * Catalogue des types de section. Endpoint absent du contrat : le mock le sert
 * localement (voir `docs/mock-divergences.md`).
 */
export async function getSectionTypes(): Promise<SectionTypeList> {
  return apiRequest<SectionTypeList>('/admin/section-types');
}

export interface PagePatch {
  revision: number;
  is_in_nav?: boolean;
  nav_position?: number | null;
}

/** `PATCH /admin/pages/{id}` — navigation et position. */
export async function patchPage(id: string, patch: PagePatch): Promise<AdminPageDetail> {
  return apiRequest<AdminPageDetail>(`/admin/pages/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: patch,
  });
}

export interface PageContentPatch {
  revision: number;
  title?: string;
  nav_label?: string;
  intro?: string;
}

/** `PUT /admin/pages/{id}/content/{lang}` — titres et introduction d'une langue. */
export async function patchPageContent(
  id: string,
  lang: ContentLang,
  patch: PageContentPatch,
): Promise<AdminPageDetail> {
  return apiRequest<AdminPageDetail>(
    `/admin/pages/${encodeURIComponent(id)}/content/${lang}`,
    { method: 'PUT', body: patch },
  );
}

export interface PageSeoPatch {
  revision: number;
  seo_title?: string;
  seo_description?: string;
}

/** `PUT /admin/pages/{id}/seo/{lang}` — métadonnées SEO d'une langue. */
export async function patchPageSeo(
  id: string,
  lang: ContentLang,
  patch: PageSeoPatch,
): Promise<AdminPageDetail> {
  return apiRequest<AdminPageDetail>(
    `/admin/pages/${encodeURIComponent(id)}/seo/${lang}`,
    { method: 'PUT', body: patch },
  );
}

export interface SectionCreate {
  revision: number;
  section_type: string;
  position?: number;
  is_active?: boolean;
}

/** `POST /admin/pages/{id}/sections` — ajout d'un bloc typé. */
export async function createSection(pageId: string, input: SectionCreate): Promise<SectionMutation> {
  return apiRequest<SectionMutation>(`/admin/pages/${encodeURIComponent(pageId)}/sections`, {
    method: 'POST',
    body: input,
  });
}

export interface SectionPatch {
  revision: number;
  position?: number;
  is_active?: boolean;
}

/** `PATCH /admin/sections/{id}` — ordre et activation. */
export async function patchSection(id: string, patch: SectionPatch): Promise<SectionMutation> {
  return apiRequest<SectionMutation>(`/admin/sections/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: patch,
  });
}

export interface SectionContentUpdate {
  revision: number;
  data: SectionValues;
}

/** `PUT /admin/sections/{id}/content/{lang}` — données d'une seule langue. */
export async function putSectionContent(
  id: string,
  lang: ContentLang,
  input: SectionContentUpdate,
): Promise<SectionMutation> {
  return apiRequest<SectionMutation>(
    `/admin/sections/${encodeURIComponent(id)}/content/${lang}`,
    { method: 'PUT', body: input },
  );
}

/** `DELETE /admin/sections/{id}` — retrait d'un bloc. */
export async function removeSection(id: string, revision: number): Promise<AdminPageDetail> {
  return apiRequest<AdminPageDetail>(`/admin/sections/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    body: { revision },
  });
}

export type WorkflowAction = 'submit_review' | 'approve' | 'reject' | 'publish';

export interface WorkflowInput {
  action: WorkflowAction;
  revision: number;
  comment?: string;
}

/**
 * Transcription du workflow éditorial. Aucun endpoint de contrat : routes
 * locales documentées dans `docs/mock-divergences.md`.
 */
export async function transitionPage(id: string, input: WorkflowInput): Promise<AdminPageDetail> {
  return apiRequest<AdminPageDetail>(`/admin/pages/${encodeURIComponent(id)}/workflow`, {
    method: 'POST',
    body: input,
  });
}

/** Libellés de statut (clés i18n). */
export const PAGE_STATUS_LABEL: Record<PageStatus, string> = {
  draft: 'pages.status.draft',
  in_review: 'pages.status.inReview',
  approved: 'pages.status.approved',
  published: 'pages.status.published',
  archived: 'pages.status.archived',
};
