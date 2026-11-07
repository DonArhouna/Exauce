/**
 * Catalogue local des types de section (mock uniquement).
 *
 * Source : `Backend/app/seed/data/section_types.json` (21 codes, doc 16 §3.4)
 * et `Backend/app/seed/payload.py`. Le contrat OpenAPI n'expose pas encore
 * d'endpoint de catalogue : ce module remplace `GET /admin/section-types`
 * en attendant (voir `Backoffice/docs/mock-divergences.md`).
 *
 * Seuls les types dont le schéma est décrit ici sont éditables ; les autres
 * s'affichent en lecture seule avec un message explicite.
 */
export type SectionFieldKind = 'text' | 'textarea' | 'list';

export interface SectionField {
  key: string;
  kind: SectionFieldKind;
  /** Clé i18n du libellé (`pages.fields.*`). */
  labelKey: string;
  required?: boolean;
  maxLength?: number;
  /** Champs d'un élément, pour `kind: 'list'`. */
  itemFields?: SectionField[];
}

export interface SectionTypeDef {
  code: string;
  labelKey: string;
  /** Page d'usage, reprise du catalogue Backend. */
  usage: string;
  /** Faux : repli lecture seule pour le MVP. */
  editable: boolean;
  fields: SectionField[];
}

const field = (
  key: string,
  kind: SectionFieldKind = 'text',
  options: Omit<SectionField, 'key' | 'kind' | 'labelKey'> = {},
): SectionField => ({ key, kind, labelKey: `pages.fields.${key}`, ...options });

const CATALOGUE: SectionTypeDef[] = [
  {
    code: 'hero',
    labelKey: 'pages.sectionTypes.hero',
    usage: 'accueil',
    editable: true,
    fields: [
      field('brand_line1', 'text', { required: true, maxLength: 40 }),
      field('brand_line2', 'text', { required: true, maxLength: 40 }),
      field('subtitle', 'textarea', { required: true, maxLength: 240 }),
      field('primary_cta', 'text', { maxLength: 40 }),
      field('secondary_cta', 'text', { maxLength: 40 }),
    ],
  },
  {
    code: 'page_header',
    labelKey: 'pages.sectionTypes.page_header',
    usage: 'pages internes',
    editable: true,
    fields: [
      field('kicker', 'text', { maxLength: 40 }),
      field('title', 'text', { required: true, maxLength: 80 }),
      field('intro', 'textarea', { maxLength: 280 }),
    ],
  },
  {
    code: 'cta',
    labelKey: 'pages.sectionTypes.cta',
    usage: 'transverse',
    editable: true,
    fields: [
      field('title', 'text', { required: true, maxLength: 80 }),
      field('text', 'textarea', { maxLength: 240 }),
      field('secondary_label', 'text', { maxLength: 40 }),
    ],
  },
  {
    code: 'stats',
    labelKey: 'pages.sectionTypes.stats',
    usage: 'accueil',
    editable: true,
    fields: [
      field('kicker', 'text', { maxLength: 40 }),
      field('items', 'list', {
        required: true,
        itemFields: [
          field('value', 'text', { required: true, maxLength: 12 }),
          field('label', 'text', { required: true, maxLength: 40 }),
        ],
      }),
    ],
  },
  {
    code: 'legal_document',
    labelKey: 'pages.sectionTypes.legal_document',
    usage: 'mentions, confidentialité, cookies',
    editable: true,
    fields: [
      field('body', 'textarea', { required: true, maxLength: 20000 }),
      field('banner_text', 'text', { maxLength: 160 }),
    ],
  },
  // Types présents dans le seed mais non outillés dans ce MVP : lecture seule.
  ...(
    [
      ['trust_bar', 'accueil'],
      ['about_preview', 'accueil'],
      ['domains_grid', 'accueil, services'],
      ['audit_grid', 'accueil, services'],
      ['interventions_grid', 'accueil'],
      ['sectors_grid', 'accueil'],
      ['publications_grid', 'accueil'],
      ['modes', 'services'],
      ['values_grid', 'à propos'],
      ['steps', 'à propos'],
      ['what_we_do', 'à propos'],
      ['founder_card', 'accueil, à propos'],
      ['interventions_compare', 'interventions'],
      ['contact_form', 'contact (position 1)'],
      ['offices_grid', 'contact (position 2)'],
      ['coming_soon', 'espace client'],
    ] as const
  ).map(([code, usage]) => ({
    code,
    labelKey: `pages.sectionTypes.${code}`,
    usage,
    editable: false,
    fields: [],
  })),
];

const BY_CODE = new Map(CATALOGUE.map((type) => [type.code, type]));

export function listSectionTypes(): SectionTypeDef[] {
  return CATALOGUE;
}

export function findSectionType(code: string): SectionTypeDef | undefined {
  return BY_CODE.get(code);
}

export interface SectionFieldError {
  field: string;
  message: string;
}

/**
 * Validation serveur du mock : mêmes règles que le formulaire, mais l'autorité
 * reste le serveur (RFC 7807 `VALIDATION_ERROR` + `errors[]`).
 */
export function validateSectionData(
  code: string,
  values: Record<string, unknown>,
): SectionFieldError[] {
  const type = findSectionType(code);
  if (!type || !type.editable) return [];
  const errors: SectionFieldError[] = [];

  const checkField = (def: SectionField, value: unknown, path: string) => {
    if (def.kind === 'list') {
      const items = Array.isArray(value) ? value : [];
      if (def.required && items.length === 0) {
        errors.push({ field: path, message: 'FIELD_REQUIRED' });
        return;
      }
      items.forEach((item, index) => {
        for (const itemField of def.itemFields ?? []) {
          const raw = (item as Record<string, unknown> | null)?.[itemField.key];
          checkField(itemField, raw, `${path}.${index}.${itemField.key}`);
        }
      });
      return;
    }

    const text = typeof value === 'string' ? value.trim() : '';
    if (def.required && text.length === 0) {
      errors.push({ field: path, message: 'FIELD_REQUIRED' });
      return;
    }
    if (def.maxLength && text.length > def.maxLength) {
      errors.push({ field: path, message: 'FIELD_TOO_LONG' });
    }
  };

  for (const def of type.fields) {
    checkField(def, values[def.key], def.key);
  }
  return errors;
}
