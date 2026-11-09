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
  options: Omit<SectionField, 'key' | 'kind' | 'labelKey'> & { labelKey?: string } = {},
): SectionField => ({
  key,
  kind,
  labelKey: options.labelKey ?? `pages.fields.${key}`,
  ...options,
});

/**
 * Grilles d'accueil et de services : le site affiche un sur-titre et un titre ;
 * le contenu (domaines, secteurs, publications, interventions) vient des
 * données, jamais du bloc. Seul le bloc audit affiche un texte d'introduction.
 */
const gridHeading = (code: string, extra: SectionField[] = []): SectionTypeDef => ({
  code,
  labelKey: `pages.sectionTypes.${code}`,
  usage: code === 'domains_grid' || code === 'audit_grid' ? 'accueil, services' : 'accueil',
  editable: true,
  fields: [
    field('kicker', 'text', { maxLength: 40 }),
    field('title', 'text', { required: true, maxLength: 80 }),
    ...extra,
  ],
});

const CATALOGUE: SectionTypeDef[] = [
  {
    code: 'hero',
    labelKey: 'pages.sectionTypes.hero',
    usage: 'accueil',
    editable: true,
    fields: [
      field('brand_line1', 'text', { required: true, maxLength: 40 }),
      field('brand_line2', 'text', { required: true, maxLength: 40 }),
      field('subtitle', 'textarea', { required: true, maxLength: 300 }),
    ],
  },
  {
    code: 'cta',
    labelKey: 'pages.sectionTypes.cta',
    usage: 'transverse',
    editable: true,
    fields: [
      field('title', 'text', { required: true, maxLength: 80 }),
      field('text', 'textarea', { maxLength: 300 }),
      field('secondary_label', 'text', { maxLength: 60 }),
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
  {
    code: 'trust_bar',
    labelKey: 'pages.sectionTypes.trust_bar',
    usage: 'accueil',
    editable: true,
    fields: [
      field('items', 'list', {
        required: true,
        itemFields: [field('text', 'text', { required: true, maxLength: 60 })],
      }),
    ],
  },
  {
    code: 'about_preview',
    labelKey: 'pages.sectionTypes.about_preview',
    usage: 'accueil',
    editable: true,
    fields: [
      field('kicker', 'text', { maxLength: 40 }),
      field('title', 'text', { required: true, maxLength: 80 }),
      field('text', 'textarea', { maxLength: 400 }),
      field('cta_label', 'text', { maxLength: 40 }),
    ],
  },
  {
    code: 'founder_card',
    labelKey: 'pages.sectionTypes.founder_card',
    usage: 'accueil, à propos',
    editable: true,
    fields: [
      field('name', 'text', { required: true, maxLength: 80, labelKey: 'pages.fields.founderName' }),
      field('role', 'text', { required: true, maxLength: 140, labelKey: 'pages.fields.founderRole' }),
      field('photo_alt', 'text', { required: true, maxLength: 120, labelKey: 'pages.fields.founderPhotoAlt' }),
      field('empty_text', 'textarea', { required: true, maxLength: 240, labelKey: 'pages.fields.founderBioComing' }),
    ],
  },
  {
    code: 'modes',
    labelKey: 'pages.sectionTypes.modes',
    usage: 'services/:familleSlug/accompagnement',
    editable: true,
    fields: [
      field('title', 'text', {
        required: true,
        labelKey: 'pages.fields.modesTitle',
      }),
      field('items', 'list', {
        required: true,
        labelKey: 'pages.fields.modes',
        itemFields: [
          field('title', 'text', { required: true, labelKey: 'pages.fields.modeTitle' }),
          field('text', 'textarea', { required: true, labelKey: 'pages.fields.modeText' }),
        ],
      }),
    ],
  },
  {
    code: 'what_we_do',
    labelKey: 'pages.sectionTypes.what_we_do',
    usage: 'à propos',
    editable: true,
    fields: [
      field('kicker', 'text', { required: true, maxLength: 60, labelKey: 'pages.fields.whatWeDoKicker' }),
      field('text', 'textarea', { required: true, maxLength: 800, labelKey: 'pages.fields.whatWeDoText' }),
    ],
  },
  {
    code: 'steps',
    labelKey: 'pages.sectionTypes.steps',
    usage: 'à propos',
    editable: true,
    fields: [
      field('kicker', 'text', { required: true, maxLength: 80, labelKey: 'pages.fields.stepsKicker' }),
      field('items', 'list', {
        required: true,
        labelKey: 'pages.fields.steps',
        itemFields: [
          field('title', 'text', { required: true, maxLength: 120, labelKey: 'pages.fields.stepTitle' }),
          field('text', 'textarea', { required: true, maxLength: 1200, labelKey: 'pages.fields.stepText' }),
        ],
      }),
    ],
  },
  {
    code: 'values_grid',
    labelKey: 'pages.sectionTypes.values_grid',
    usage: 'à propos',
    editable: true,
    fields: [
      field('title', 'text', { required: true, maxLength: 100, labelKey: 'pages.fields.valuesTitle' }),
      field('empty_text', 'textarea', { required: true, maxLength: 400, labelKey: 'pages.fields.valuesComing' }),
    ],
  },
  {
    code: 'interventions_compare',
    labelKey: 'pages.sectionTypes.interventions_compare',
    usage: 'interventions',
    editable: true,
    fields: [
      field('title', 'text', { required: true, maxLength: 140, labelKey: 'pages.fields.compareTitle' }),
      field('head_label', 'text', { required: true, maxLength: 80, labelKey: 'pages.fields.compareHead' }),
      field('caption', 'textarea', { required: true, maxLength: 400, labelKey: 'pages.fields.compareCaption' }),
      field('rows', 'list', {
        required: true,
        labelKey: 'pages.fields.compareRows',
        itemFields: [
          field('label', 'text', { required: true, maxLength: 100, labelKey: 'pages.fields.compareRowLabel' }),
          field('recurring', 'textarea', { required: true, maxLength: 600, labelKey: 'pages.fields.compareRecurring' }),
          field('oneoff', 'textarea', { required: true, maxLength: 600, labelKey: 'pages.fields.compareOneoff' }),
        ],
      }),
    ],
  },
  {
    code: 'contact_form',
    labelKey: 'pages.sectionTypes.contact_form',
    usage: 'contact (position 1)',
    editable: true,
    fields: [
      field('success_text', 'textarea', { required: true, maxLength: 300, labelKey: 'pages.fields.contactSuccess' }),
    ],
  },
  gridHeading('domains_grid'),
  gridHeading('audit_grid', [field('text', 'textarea', { maxLength: 400, labelKey: 'pages.fields.intro' })]),
  gridHeading('interventions_grid'),
  gridHeading('sectors_grid'),
  gridHeading('publications_grid', [
    field('cta_label', 'text', { maxLength: 40 }),
    field('empty_text', 'text', { maxLength: 120 }),
  ]),
  // Types présents dans le seed mais non outillés dans ce MVP : lecture seule.
  ...(
    [
      ['offices_grid', 'contact (position 2)'],
      ['partners_marquee', 'partenaires'],
      ['partners_grid', 'partenaires'],
      ['coming_soon', 'espace client (bloc non rendu par le site)'],
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
