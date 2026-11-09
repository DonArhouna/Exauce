/**
 * Contenu éditorial du mock, aligné sur le seed Backend
 * (`Backend/app/seed/payload.py` : `PAGES`, `SECTION_INSTANCES` et
 * `Backend/app/seed/data/section_types.json`).
 *
 * 11 pages dont 8 en navigation, 32 blocs (accueil 10, services 5,
 * interventions 2, à propos 5, publications 1, partenaires 4, contact 2,
 * mentions 3), 23 types de sections. `legal_notice` est en brouillon avec
 * `banners_pending`. Le contenu éditorial vit dans `pagesSeed.ts`.
 *
 * Écarts assumés avec le contrat OpenAPI (documentés dans
 * `Backoffice/docs/mock-divergences.md`) : `data` est un objet `{ fr, en }`
 * par bloc, chaque page porte un `revision` et un `titles` bilingue.
 */
import type {
  AdminPageDetail,
  AdminPageSummary,
  AdminSection,
  ContentLang,
  PageStatus,
  SectionValues,
} from '../types';
import { PAGE_SEED } from './pagesSeed';
import { listSectionTypes, validateSectionData } from './sectionTypes';

type MockLang = ContentLang;
type Values = SectionValues;
type MockSection = AdminSection;
type PageSummary = AdminPageSummary;
type PageDetail = AdminPageDetail;

export interface MockPage {
  id: string;
  page_key: string;
  template: string;
  is_in_nav: boolean;
  nav_position: number | null;
  is_system: boolean;
  status: PageStatus;
  nav_label: Record<MockLang, string>;
  intro: Record<MockLang, string>;
  seo_title: Record<MockLang, string>;
  seo_description: Record<MockLang, string>;
  banners_pending: boolean;
  revision: number;
  /** Auteur de la soumission en relecture (interdit l'auto-approbation). */
  submitted_by: string | null;
  title: Record<MockLang, string>;
  slug: Record<MockLang, string | null>;
  sections: MockSection[];
}

function pageId(index: number): string {
  return `aaaaaaaa-000${index + 1}-4001-8001-00000000000${index + 1}`;
}

function sectionId(index: number): string {
  const suffix = String(index + 1).padStart(2, '0');
  return `bbbbbbbb-0001-4001-8001-0000000000${suffix}`;
}

function materialize(): MockPage[] {
  let sectionIndex = 0;
  return PAGE_SEED.map((seed, pageIndex) => ({
    id: pageId(pageIndex),
    page_key: seed.key,
    template: seed.template,
    is_in_nav: seed.nav !== null,
    nav_position: seed.nav,
    is_system: seed.system,
    status: seed.status,
    nav_label: { fr: seed.title[0], en: seed.title[1] },
    intro: { fr: '', en: '' },
    seo_title: { fr: '', en: '' },
    seo_description: { fr: '', en: '' },
    banners_pending: seed.banners ?? false,
    revision: 1,
    submitted_by: null,
    title: { fr: seed.title[0], en: seed.title[1] },
    slug: { fr: seed.slug[0], en: seed.slug[1] },
    sections: seed.sections.map((section, index) => ({
      id: sectionId(sectionIndex++),
      section_type: section.type,
      source_key: section.source,
      position: index + 1,
      is_active: true,
      config: section.config ?? {},
      data: { fr: section.fr, en: section.en },
    })),
  }));
}

let pages = materialize();
let nextId = pages.reduce((total, page) => total + page.sections.length, 0);

const KNOWN_TYPES = new Set(listSectionTypes().map((type) => type.code));

export function listPages(): PageSummary[] {
  return pages
    .map((page) => ({
      id: page.id,
      page_key: page.page_key,
      template: page.template,
      is_in_nav: page.is_in_nav,
      nav_position: page.nav_position,
      is_system: page.is_system,
      status: page.status,
      title: page.title,
      section_count: page.sections.length,
    }))
    .sort((a, b) => {
      if (a.is_in_nav !== b.is_in_nav) return a.is_in_nav ? -1 : 1;
      if (a.is_in_nav && b.is_in_nav) return (a.nav_position ?? 0) - (b.nav_position ?? 0);
      return a.page_key.localeCompare(b.page_key);
    });
}

export function findPage(id: string): MockPage | undefined {
  return pages.find((page) => page.id === id);
}

export function pageDetail(page: MockPage): PageDetail {
  return {
    id: page.id,
    page_key: page.page_key,
    template: page.template,
    is_in_nav: page.is_in_nav,
    nav_position: page.nav_position,
    is_system: page.is_system,
    status: page.status,
    nav_label: page.nav_label,
    intro: page.intro,
    seo_title: page.seo_title,
    seo_description: page.seo_description,
    banners_pending: page.banners_pending,
    revision: page.revision,
    title: page.title,
    slug: page.slug,
    section_count: page.sections.length,
    sections: [...page.sections].sort((a, b) => a.position - b.position).map(cloneSection),
  };
}

export function cloneSection(section: MockSection): MockSection {
  return {
    ...section,
    config: { ...section.config },
    data: { fr: { ...section.data.fr }, en: { ...section.data.en } },
  };
}

/** Version de page attendue par le client : toute divergence renvoie 409. */
function bump(page: MockPage): void {
  page.revision += 1;
}

export interface UpdatePageInput {
  revision: number;
  is_in_nav?: boolean;
  nav_position?: number | null;
}

export type MutationResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: 'CONFLICT' | 'NOT_FOUND' | 'VALIDATION_ERROR'; detail?: string; errors?: { field: string; message: string }[] };

export function updatePage(id: string, input: UpdatePageInput): MutationResult<PageDetail> {
  const page = findPage(id);
  if (!page) return { ok: false, code: 'NOT_FOUND' };
  if (page.revision !== input.revision) return { ok: false, code: 'CONFLICT' };

  if (input.is_in_nav !== undefined) {
    if (page.is_system && !input.is_in_nav) {
      return { ok: false, code: 'VALIDATION_ERROR', detail: 'Une page système reste toujours dans la navigation.' };
    }
    page.is_in_nav = input.is_in_nav;
    if (!input.is_in_nav) page.nav_position = null;
  }
  if (input.nav_position !== undefined) {
    if (page.is_in_nav && input.nav_position === null) {
      return { ok: false, code: 'VALIDATION_ERROR', detail: 'Position requise pour une page de navigation.' };
    }
    page.nav_position = input.nav_position;
  }

  bump(page);
  return { ok: true, value: pageDetail(page) };
}

export interface AddSectionInput {
  revision: number;
  section_type: string;
  position?: number;
  is_active?: boolean;
}

export function addSection(pageId: string, input: AddSectionInput): MutationResult<{ page: PageDetail; section: MockSection }> {
  const page = findPage(pageId);
  if (!page) return { ok: false, code: 'NOT_FOUND' };
  if (page.revision !== input.revision) return { ok: false, code: 'CONFLICT' };
  if (!KNOWN_TYPES.has(input.section_type)) {
    return { ok: false, code: 'VALIDATION_ERROR', detail: 'Type de section inconnu' };
  }

  const position = input.position ?? page.sections.length + 1;
  for (const section of page.sections) {
    if (section.position >= position) section.position += 1;
  }

  const section: MockSection = {
    id: sectionId(nextId++),
    section_type: input.section_type,
    source_key: null,
    position,
    is_active: input.is_active ?? true,
    config: {},
    data: { fr: {}, en: {} },
  };
  page.sections.push(section);
  bump(page);
  return { ok: true, value: { page: pageDetail(page), section: cloneSection(section) } };
}

export interface UpdateSectionInput {
  revision: number;
  position?: number;
  is_active?: boolean;
  config?: Values;
  lang?: MockLang;
  data?: Values;
}

function findSection(id: string): { page: MockPage; section: MockSection } | undefined {
  for (const page of pages) {
    const section = page.sections.find((item) => item.id === id);
    if (section) return { page, section };
  }
  return undefined;
}

export function updateSection(id: string, input: UpdateSectionInput): MutationResult<{ page: PageDetail; section: MockSection }> {
  const found = findSection(id);
  if (!found) return { ok: false, code: 'NOT_FOUND' };
  const { page, section } = found;
  if (page.revision !== input.revision) return { ok: false, code: 'CONFLICT' };

  if (input.lang && input.data) {
    const errors = validateSectionData(section.section_type, input.data);
    if (errors.length > 0) {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        detail: 'Données de section invalides',
        errors: errors.map((error) => ({ field: `${input.lang}.${error.field}`, message: error.message })),
      };
    }
    section.data[input.lang] = { ...input.data };
  }
  if (input.is_active !== undefined) section.is_active = input.is_active;
  if (input.config !== undefined) section.config = { ...input.config };
  if (input.position !== undefined && input.position !== section.position) {
    const target = Math.min(Math.max(input.position, 1), page.sections.length);
    const ordered = [...page.sections].sort((a, b) => a.position - b.position);
    const from = ordered.indexOf(section);
    ordered.splice(from, 1);
    ordered.splice(target - 1, 0, section);
    ordered.forEach((item, index) => {
      item.position = index + 1;
    });
  }

  bump(page);
  return { ok: true, value: { page: pageDetail(page), section: cloneSection(section) } };
}

export function deleteSection(id: string, revision: number): MutationResult<PageDetail> {
  const found = findSection(id);
  if (!found) return { ok: false, code: 'NOT_FOUND' };
  const { page, section } = found;
  if (page.revision !== revision) return { ok: false, code: 'CONFLICT' };

  page.sections = page.sections.filter((item) => item !== section);
  [...page.sections]
    .sort((a, b) => a.position - b.position)
    .forEach((item, index) => {
      item.position = index + 1;
    });
  bump(page);
  return { ok: true, value: pageDetail(page) };
}

export type WorkflowAction = 'submit_review' | 'approve' | 'reject' | 'publish';

const TRANSITIONS: Record<WorkflowAction, { from: PageStatus[]; to: PageStatus }> = {
  submit_review: { from: ['draft'], to: 'in_review' },
  approve: { from: ['in_review'], to: 'approved' },
  reject: { from: ['in_review'], to: 'draft' },
  publish: { from: ['approved'], to: 'published' },
};

export function transitionPage(
  id: string,
  action: WorkflowAction,
  revision: number,
  actorId: string,
  comment?: string,
): MutationResult<PageDetail> {
  const page = findPage(id);
  if (!page) return { ok: false, code: 'NOT_FOUND' };
  if (page.revision !== revision) return { ok: false, code: 'CONFLICT' };

  const transition = TRANSITIONS[action];
  if (!transition.from.includes(page.status)) {
    return { ok: false, code: 'VALIDATION_ERROR', detail: 'Transition impossible depuis ce statut' };
  }
  if (action === 'reject' && !comment?.trim()) {
    return { ok: false, code: 'VALIDATION_ERROR', detail: 'Un motif est obligatoire pour rejeter' };
  }
  if (action === 'approve' && page.submitted_by === actorId) {
    return { ok: false, code: 'VALIDATION_ERROR', detail: 'AUTO_APPROVAL_FORBIDDEN' };
  }

  page.status = transition.to;
  if (action === 'submit_review') page.submitted_by = actorId;
  if (action === 'reject') {
    page.banners_pending = true;
    page.submitted_by = null;
  }
  if (action === 'approve') page.banners_pending = false;
  if (action === 'publish') page.submitted_by = null;
  bump(page);
  return { ok: true, value: pageDetail(page) };
}

/** Réinitialise le contenu (tests et déconnexion de démonstration). */
export function resetPages(): void {
  pages = materialize();
  nextId = pages.reduce((total, page) => total + page.sections.length, 0);
}
