/**
 * Bureaux (mock uniquement).
 *
 * Le contrat expose `GET/POST /admin/offices` et `PATCH/DELETE
 * /admin/offices/{id}` avec `OfficeUpsert`, qui ne porte pas les textes
 * bilingues (`name`, `city`, `address_lines`). Le mock accepte donc
 * `translations` dans le corps d'écriture : écart consigné dans
 * `docs/mock-divergences.md`.
 */
import type { AdminOffice, ContentLang, OfficeTranslation, OfficeWrite } from '../types';

export interface OfficeMutation {
  ok: boolean;
  code?: 'not_found' | 'code_taken' | 'invalid' | 'headquarters_protected';
  field?: string;
  value?: AdminOffice;
}

const LANGS: ContentLang[] = ['fr', 'en'];

function emptyTranslation(): OfficeTranslation {
  return { name: '', city: '', address_lines: [] };
}

function office(
  index: number,
  input: Omit<AdminOffice, 'id'> & { id?: string },
): AdminOffice {
  return {
    ...input,
    id: input.id ?? `bbbbbbbb-${String(index).padStart(4, '0')}-4001-8001-${String(index).padStart(12, '0')}`,
  };
}

function initialOffices(): AdminOffice[] {
  return [
    office(1, {
      code: 'ABJ',
      position: 1,
      is_headquarters: true,
      is_active: true,
      phone_fixed: '+225 27 20 00 00 01',
      phone_mobile: '+225 07 00 00 00 01',
      email: 'abidjan@example.ci',
      map_url: 'https://maps.example.ci/abidjan',
      translations: {
        fr: {
          name: 'Siège d’Abidjan',
          city: 'Abidjan',
          address_lines: ['Immeuble Le Plateau, 4e étage', 'Rue du Commerce, Plateau', '01 BP 0000 Abidjan 01'],
        },
        en: {
          name: 'Abidjan head office',
          city: 'Abidjan',
          address_lines: ['Le Plateau building, 4th floor', 'Rue du Commerce, Plateau', '01 BP 0000 Abidjan 01'],
        },
      },
    }),
    office(2, {
      code: 'YAM',
      position: 2,
      is_headquarters: false,
      is_active: true,
      phone_fixed: '+225 27 30 00 00 02',
      phone_mobile: null,
      email: 'yamoussoukro@example.ci',
      map_url: null,
      translations: {
        fr: {
          name: 'Bureau de Yamoussoukro',
          city: 'Yamoussoukro',
          address_lines: ['Quartier Millionnaire', 'BP 0000 Yamoussoukro'],
        },
        en: {
          name: 'Yamoussoukro office',
          city: 'Yamoussoukro',
          address_lines: ['Millionnaire district', 'BP 0000 Yamoussoukro'],
        },
      },
    }),
    office(3, {
      code: 'BKE',
      position: 3,
      is_headquarters: false,
      is_active: true,
      phone_fixed: null,
      phone_mobile: '+225 05 00 00 00 03',
      email: null,
      map_url: null,
      translations: {
        fr: {
          name: 'Bureau de Bouaké',
          city: 'Bouaké',
          address_lines: ['Avenue Houphouët-Boigny'],
        },
        en: {
          name: 'Bouaké office',
          city: 'Bouaké',
          address_lines: ['Avenue Houphouët-Boigny'],
        },
      },
    }),
  ];
}

let offices: AdminOffice[] = initialOffices();
let sequence = offices.length;

function normalize(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeTranslation(input: Partial<OfficeTranslation> | undefined): OfficeTranslation {
  return {
    name: normalize(input?.name ?? ''),
    city: normalize(input?.city ?? ''),
    address_lines: (input?.address_lines ?? []).map(normalize).filter(Boolean),
  };
}

function sorted(): AdminOffice[] {
  return [...offices].sort((a, b) => a.position - b.position || a.code.localeCompare(b.code));
}

export function listOffices(): AdminOffice[] {
  return sorted();
}

export function findOffice(id: string): AdminOffice | undefined {
  return offices.find((entry) => entry.id === id);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAP_URL = /^https?:\/\/\S+$/;

/** Valide une écriture et renvoie le champ fautif, le cas échéant. */
function validate(input: OfficeWrite, id?: string): { code: OfficeMutation['code']; field?: string } | null {
  const code = normalize(input.code ?? '').toUpperCase();
  if (!/^[A-Z0-9-]{2,8}$/.test(code)) return { code: 'invalid', field: 'code' };
  if (offices.some((entry) => entry.code === code && entry.id !== id)) {
    return { code: 'code_taken', field: 'code' };
  }
  const fr = normalizeTranslation(input.translations?.fr);
  if (!fr.name) return { code: 'invalid', field: 'name' };
  if (!fr.city) return { code: 'invalid', field: 'city' };
  if (input.email && !EMAIL.test(input.email.trim())) return { code: 'invalid', field: 'email' };
  if (input.map_url && !MAP_URL.test(input.map_url.trim())) return { code: 'invalid', field: 'map_url' };
  if (input.position !== undefined && (!Number.isInteger(input.position) || input.position < 1)) {
    return { code: 'invalid', field: 'position' };
  }
  return null;
}

function contact(input: OfficeWrite) {
  return {
    phone_fixed: input.phone_fixed?.trim() || null,
    phone_mobile: input.phone_mobile?.trim() || null,
    email: input.email?.trim() || null,
    map_url: input.map_url?.trim() || null,
  };
}

function translations(input: OfficeWrite): Record<ContentLang, OfficeTranslation> {
  const result = { fr: emptyTranslation(), en: emptyTranslation() } as Record<ContentLang, OfficeTranslation>;
  for (const lang of LANGS) {
    const fr = normalizeTranslation(input.translations?.fr);
    const raw = normalizeTranslation(input.translations?.[lang]);
    // Une traduction absente reprend le français : le site n'affiche jamais
    // de bureau sans nom.
    result[lang] = raw.name ? raw : { ...fr };
  }
  return result;
}

/** Un seul siège : activer le flag le retire des autres bureaux. */
function applyHeadquarters(target: string, isHeadquarters: boolean): AdminOffice[] {
  if (!isHeadquarters) return offices;
  return offices.map((entry) => ({ ...entry, is_headquarters: entry.id === target }));
}

export function createOffice(input: OfficeWrite): OfficeMutation {
  const invalid = validate(input);
  if (invalid) return { ok: false, code: invalid.code, field: invalid.field };

  sequence += 1;
  const created: AdminOffice = {
    id: `bbbbbbbb-${String(sequence).padStart(4, '0')}-4001-8001-${String(sequence).padStart(12, '0')}`,
    code: normalize(input.code).toUpperCase(),
    position: input.position ?? offices.length + 1,
    is_headquarters: Boolean(input.is_headquarters),
    is_active: input.is_active ?? true,
    ...contact(input),
    translations: translations(input),
  };
  offices = applyHeadquarters(created.id, created.is_headquarters);
  offices = [...offices, created];
  return { ok: true, value: created };
}

export function updateOffice(id: string, input: OfficeWrite): OfficeMutation {
  const current = offices.find((entry) => entry.id === id);
  if (!current) return { ok: false, code: 'not_found' };
  const invalid = validate(input, id);
  if (invalid) return { ok: false, code: invalid.code, field: invalid.field };

  const updated: AdminOffice = {
    ...current,
    code: normalize(input.code).toUpperCase(),
    position: input.position ?? current.position,
    is_headquarters: input.is_headquarters ?? current.is_headquarters,
    is_active: input.is_active ?? current.is_active,
    ...contact(input),
    translations: translations(input),
  };
  offices = applyHeadquarters(updated.id, updated.is_headquarters);
  offices = offices.map((entry) => (entry.id === id ? updated : entry));
  return { ok: true, value: updated };
}

/** Refuse la suppression du siège tant qu'aucun successeur n'est désigné. */
export function deleteOffice(id: string): OfficeMutation {
  const current = offices.find((entry) => entry.id === id);
  if (!current) return { ok: false, code: 'not_found' };
  if (current.is_headquarters) return { ok: false, code: 'headquarters_protected' };
  offices = offices.filter((entry) => entry.id !== id);
  return { ok: true };
}

/** Remet les bureaux de démonstration à leur état initial. */
export function resetOffices(): void {
  offices = initialOffices();
  sequence = offices.length;
}
