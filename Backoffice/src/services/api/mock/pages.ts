/**
 * Contenu éditorial du mock, aligné sur le seed Backend
 * (`Backend/app/seed/payload.py` : `PAGES`, `SECTION_INSTANCES` et
 * `Backend/app/seed/data/section_types.json`).
 *
 * 10 pages dont 7 en navigation, 29 blocs (accueil 10, services 5,
 * interventions 2, à propos 5, publications 1, contact 2, espace client 1,
 * mentions 3), 21 types de sections. `legal_notice` est en brouillon avec
 * `banners_pending`.
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
  banners_pending: boolean;
  revision: number;
  /** Auteur de la soumission en relecture (interdit l'auto-approbation). */
  submitted_by: string | null;
  title: Record<MockLang, string>;
  slug: Record<MockLang, string | null>;
  sections: MockSection[];
}

interface SeedSection {
  type: string;
  source: string;
  fr: Values;
  en: Values;
  config?: Values;
  inactive?: boolean;
}

interface SeedPage {
  key: string;
  template: string;
  nav: number | null;
  system: boolean;
  status: PageStatus;
  banners?: boolean;
  title: [string, string];
  slug: [string | null, string | null];
  sections: SeedSection[];
}

const SEED: SeedPage[] = [
  {
    key: 'home',
    template: 'home',
    nav: 0,
    system: true,
    status: 'published',
    title: ['Accueil', 'Home'],
    slug: ['', ''],
    sections: [
      {
        type: 'hero',
        source: 'hero',
        fr: {
          brand_line1: 'Exauce',
          brand_line2: 'Audit & Conseil',
          subtitle:
            'Comptabilité, audit et conseil pour les entreprises qui veulent des comptes fiables et des décisions éclairées.',
          primary_cta: 'Prendre rendez-vous',
          secondary_cta: 'Nos services',
        },
        en: {
          brand_line1: 'Exauce',
          brand_line2: 'Audit & Advisory',
          subtitle:
            'Accounting, audit and advisory for companies that need reliable figures and informed decisions.',
          primary_cta: 'Book a meeting',
          secondary_cta: 'Our services',
        },
        config: { variant: 'split' },
      },
      {
        type: 'trust_bar',
        source: 'trust_bar',
        fr: { items: [{ text: 'Experts-comptables' }, { text: 'Commissaires aux comptes' }, { text: 'Conseil fiscal' }] },
        en: { items: [{ text: 'Chartered accountants' }, { text: 'Statutory auditors' }, { text: 'Tax advisory' }] },
      },
      {
        type: 'about_preview',
        source: 'about_preview',
        fr: { kicker: 'Qui sommes-nous', title: 'Un cabinet de proximité', text: 'Une équipe pluridisciplinaire au service des PME.', cta_label: 'En savoir plus' },
        en: { kicker: 'About us', title: 'A nearby firm', text: 'A multidisciplinary team serving SMEs.', cta_label: 'Learn more' },
      },
      {
        type: 'domains_grid',
        source: 'domains_grid',
        fr: { kicker: 'Domaines', title: 'Nos domaines d’expertise' },
        en: { kicker: 'Domains', title: 'Our areas of expertise' },
      },
      {
        type: 'audit_grid',
        source: 'audit_grid',
        fr: { kicker: 'Audit', title: 'Audit légal et contractuel', text: 'Une démarche rigoureuse et documentée.' },
        en: { kicker: 'Audit', title: 'Statutory and contractual audit', text: 'A rigorous, documented approach.' },
      },
      {
        type: 'interventions_grid',
        source: 'interventions_grid',
        fr: { kicker: 'Interventions', title: 'Nos interventions' },
        en: { kicker: 'Interventions', title: 'Our engagements' },
      },
      {
        type: 'sectors_grid',
        source: 'sectors_grid',
        fr: { kicker: 'Secteurs', title: 'Secteurs accompagnés' },
        en: { kicker: 'Sectors', title: 'Sectors we serve' },
      },
      {
        type: 'stats',
        source: 'stats',
        fr: {
          kicker: 'Le cabinet en chiffres',
          items: [
            { value: '18', label: 'années d’expérience' },
            { value: '240', label: 'clients accompagnés' },
            { value: '12', label: 'collaborateurs' },
            { value: '3', label: 'bureaux' },
          ],
        },
        en: {
          kicker: 'The firm in figures',
          items: [
            { value: '18', label: 'years of experience' },
            { value: '240', label: 'clients served' },
            { value: '12', label: 'team members' },
            { value: '3', label: 'offices' },
          ],
        },
      },
      {
        type: 'publications_grid',
        source: 'publications_grid',
        fr: { kicker: 'Actualités', title: 'Dernières publications', cta_label: 'Tout voir', empty_text: 'Aucune publication.' },
        en: { kicker: 'News', title: 'Latest publications', cta_label: 'See all', empty_text: 'No publication yet.' },
      },
      {
        type: 'cta',
        source: 'cta',
        fr: {
          title: 'Parlons de votre projet',
          text: 'Un premier échange de trente minutes, sans engagement.',
          secondary_label: 'Nous écrire',
        },
        en: {
          title: 'Let’s talk about your project',
          text: 'A first thirty-minute conversation, with no commitment.',
          secondary_label: 'Contact us',
        },
      },
    ],
  },
  {
    key: 'services',
    template: 'standard',
    nav: 1,
    system: false,
    status: 'published',
    title: ['Services', 'Services'],
    slug: ['services', 'services'],
    sections: [
      {
        type: 'page_header',
        source: 'header',
        fr: { kicker: 'Services', title: 'Nos services', intro: 'Comptabilité, audit, fiscalité et conseil en gestion.' },
        en: { kicker: 'Services', title: 'Our services', intro: 'Accounting, audit, tax and management advisory.' },
      },
      {
        type: 'modes',
        source: 'modes',
        fr: {
          title: 'Nos modes d’intervention',
          items: [
            { title: 'Assistance', text: 'Nous tenons vos comptes et vous conseillons.' },
            { title: 'Supervision', text: 'Nous contrôlons et fiabilisons vos travaux.' },
          ],
        },
        en: {
          title: 'How we work',
          items: [
            { title: 'Assistance', text: 'We keep your books and advise you.' },
            { title: 'Supervision', text: 'We review and secure your work.' },
          ],
        },
      },
      {
        type: 'domains_grid',
        source: 'domains_grid',
        fr: { kicker: 'Domaines', title: 'Domaines couverts' },
        en: { kicker: 'Domains', title: 'Covered domains' },
      },
      {
        type: 'audit_grid',
        source: 'audit_grid',
        fr: { kicker: 'Audit', title: 'Audit et certification', text: 'Des comptes certifiés sans réserve.' },
        en: { kicker: 'Audit', title: 'Audit and certification', text: 'Unqualified certified accounts.' },
      },
      {
        type: 'cta',
        source: 'cta',
        fr: { title: 'Besoin d’un accompagnement ?', text: 'Nous cadrons le périmètre avec vous.', secondary_label: 'Demander un devis' },
        en: { title: 'Need support?', text: 'We scope the engagement with you.', secondary_label: 'Request a quote' },
      },
    ],
  },
  {
    key: 'interventions',
    template: 'standard',
    nav: 2,
    system: false,
    status: 'published',
    title: ['Interventions', 'Engagements'],
    slug: ['interventions', 'interventions'],
    sections: [
      {
        type: 'page_header',
        source: 'header',
        fr: { kicker: 'Interventions', title: 'Nos interventions', intro: 'Ponctuelles ou récurrentes, selon vos besoins.' },
        en: { kicker: 'Engagements', title: 'Our engagements', intro: 'One-off or recurring, depending on your needs.' },
      },
      {
        type: 'interventions_compare',
        source: 'compare',
        fr: {
          title: 'Récurrent ou ponctuel',
          head_label: 'Intervention',
          caption: 'Comparatif indicatif.',
          rows: [{ label: 'Tenue de comptabilité', recurring: 'Oui', oneoff: 'Non' }],
        },
        en: {
          title: 'Recurring or one-off',
          head_label: 'Engagement',
          caption: 'Indicative comparison.',
          rows: [{ label: 'Bookkeeping', recurring: 'Yes', oneoff: 'No' }],
        },
      },
    ],
  },
  {
    key: 'sectors',
    template: 'standard',
    nav: 3,
    system: false,
    status: 'published',
    title: ['Secteurs', 'Sectors'],
    slug: ['secteurs', 'sectors'],
    sections: [],
  },
  {
    key: 'publications',
    template: 'standard',
    nav: 4,
    system: false,
    status: 'published',
    title: ['Publications', 'Publications'],
    slug: ['publications', 'publications'],
    sections: [
      {
        type: 'page_header',
        source: 'header',
        fr: { kicker: 'Publications', title: 'Actualités et analyses', intro: 'Nos notes de lecture réglementaire.' },
        en: { kicker: 'Publications', title: 'News and analysis', intro: 'Our regulatory reading notes.' },
      },
    ],
  },
  {
    key: 'about',
    template: 'standard',
    nav: 5,
    system: false,
    status: 'published',
    title: ['À propos', 'About us'],
    slug: ['a-propos', 'about-us'],
    sections: [
      {
        type: 'page_header',
        source: 'header',
        fr: { kicker: 'Le cabinet', title: 'À propos d’Exauce', intro: 'Un cabinet indépendant, ancré en Afrique de l’Ouest.' },
        en: { kicker: 'The firm', title: 'About Exauce', intro: 'An independent firm rooted in West Africa.' },
      },
      {
        type: 'what_we_do',
        source: 'what_we_do',
        fr: { title: 'Ce que nous faisons', text: 'Nous fiabilisons l’information financière.' },
        en: { title: 'What we do', text: 'We make financial information reliable.' },
      },
      {
        type: 'steps',
        source: 'how_we_work',
        fr: { kicker: 'Méthode', items: [{ title: 'Cadrage', text: 'Comprendre vos enjeux.' }, { title: 'Exécution', text: 'Produire et documenter.' }] },
        en: { kicker: 'Method', items: [{ title: 'Scoping', text: 'Understand your challenges.' }, { title: 'Delivery', text: 'Produce and document.' }] },
      },
      {
        type: 'values_grid',
        source: 'values',
        fr: { title: 'Nos valeurs', empty_text: 'Aucune valeur publiée.', items: [{ title: 'Rigueur', text: 'La preuve avant l’opinion.' }] },
        en: { title: 'Our values', empty_text: 'No value published.', items: [{ title: 'Rigour', text: 'Evidence before opinion.' }] },
      },
      {
        type: 'founder_card',
        source: 'founder_card',
        fr: { kicker: 'Le fondateur', empty_text: 'Profil à venir.' },
        en: { kicker: 'The founder', empty_text: 'Profile coming soon.' },
      },
    ],
  },
  {
    key: 'contact',
    template: 'contact',
    nav: 6,
    system: false,
    status: 'published',
    title: ['Contact', 'Contact'],
    slug: ['contact', 'contact'],
    sections: [
      {
        type: 'contact_form',
        source: 'contact_form',
        fr: { intro: 'Décrivez votre besoin, nous revenons vers vous sous 48 heures.', success_text: 'Merci, votre demande a été envoyée.' },
        en: { intro: 'Describe your need and we will reply within 48 hours.', success_text: 'Thank you, your message has been sent.' },
      },
      {
        type: 'offices_grid',
        source: 'offices_grid',
        fr: { title: 'Nos implantations', intro: 'Trois bureaux en Côte d’Ivoire.', empty_text: 'Aucun bureau publié.' },
        en: { title: 'Our offices', intro: 'Three offices in Côte d’Ivoire.', empty_text: 'No office published.' },
      },
    ],
  },
  {
    key: 'legal_notice',
    template: 'legal',
    nav: null,
    system: true,
    status: 'draft',
    banners: true,
    title: ['Mentions légales', 'Legal notice'],
    slug: ['mentions-legales', 'legal-notice'],
    sections: [
      {
        type: 'legal_document',
        source: 'mentions',
        fr: { body: 'Exauce Auditor & Conseil, société anonyme au capital de 10 000 000 FCFA, Abidjan, Côte d’Ivoire.', banner_text: 'Document en cours de validation juridique.' },
        en: { body: 'Exauce Auditor & Conseil, a public limited company with capital of XOF 10,000,000, Abidjan, Côte d’Ivoire.', banner_text: 'Document pending legal review.' },
      },
      {
        type: 'legal_document',
        source: 'privacy',
        fr: { body: 'Les données transmises via le formulaire de contact sont conservées 24 mois.', banner_text: '' },
        en: { body: 'Data submitted through the contact form is kept for 24 months.', banner_text: '' },
      },
      {
        type: 'legal_document',
        source: 'cookies',
        fr: { body: 'Le site n’utilise que des cookies techniques nécessaires à son fonctionnement.', banner_text: '' },
        en: { body: 'The site only uses technical cookies required to operate.', banner_text: '' },
      },
    ],
  },
  {
    key: 'client_area',
    template: 'coming_soon',
    nav: null,
    system: false,
    status: 'published',
    title: ['Espace client', 'Customer area'],
    slug: ['espace-client', 'customer-area'],
    sections: [
      {
        type: 'coming_soon',
        source: 'coming_soon',
        fr: { title: 'Bientôt disponible', text: 'Votre espace documentaire arrive.', cta_label: 'Nous contacter' },
        en: { title: 'Coming soon', text: 'Your document area is on its way.', cta_label: 'Contact us' },
      },
    ],
  },
  {
    key: 'not_found',
    template: 'coming_soon',
    nav: null,
    system: true,
    status: 'published',
    title: ['Page introuvable', 'Page not found'],
    slug: [null, null],
    sections: [],
  },
];

function pageId(index: number): string {
  return `aaaaaaaa-000${index + 1}-4001-8001-00000000000${index + 1}`;
}

function sectionId(index: number): string {
  const suffix = String(index + 1).padStart(2, '0');
  return `bbbbbbbb-0001-4001-8001-0000000000${suffix}`;
}

function materialize(): MockPage[] {
  let sectionIndex = 0;
  return SEED.map((seed, pageIndex) => ({
    id: pageId(pageIndex),
    page_key: seed.key,
    template: seed.template,
    is_in_nav: seed.nav !== null,
    nav_position: seed.nav,
    is_system: seed.system,
    status: seed.status,
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
      is_active: !section.inactive,
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
