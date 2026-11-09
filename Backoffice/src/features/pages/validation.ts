import type { ContentLang, SectionField, SectionTypeDef, SectionValues } from '@/services/api/types';

/** Erreurs par langue puis par chemin de champ : `fr.subtitle`, `en.items.0.label`. */
export type SectionErrors = Record<string, string>;

function validateField(
  field: SectionField,
  value: unknown,
  prefix: string,
  errors: SectionErrors,
): void {
  if (field.kind === 'list') {
    const items = Array.isArray(value) ? value : [];
    if (field.required && items.length === 0) {
      errors[prefix + field.key] = 'FIELD_REQUIRED';
      return;
    }
    items.forEach((item, index) => {
      for (const itemField of field.itemFields ?? []) {
        const raw = (item as SectionValues | null)?.[itemField.key];
        validateField(itemField, raw, `${prefix}${field.key}.${index}.`, errors);
      }
    });
    return;
  }

  const text = typeof value === 'string' ? value.trim() : '';
  if (field.required && text.length === 0) {
    errors[prefix + field.key] = 'FIELD_REQUIRED';
    return;
  }
  if (field.maxLength && text.length > field.maxLength) {
    errors[prefix + field.key] = 'FIELD_TOO_LONG';
  }
}

/** Validation cliente : le serveur reste l'autorité (RFC 7807). */
export function validateValues(
  type: SectionTypeDef,
  lang: ContentLang,
  values: SectionValues,
): SectionErrors {
  const errors: SectionErrors = {};
  for (const field of type.fields) {
    validateField(field, values[field.key], `${lang}.`, errors);
  }
  return errors;
}

/** Champs obligatoires remplis dans une langue, pour l'indicateur de complétude. */
export function completeness(
  type: SectionTypeDef,
  values: SectionValues,
): { filled: number; total: number } {
  const required = type.fields.filter((field) => field.required);
  const filled = required.filter((field) => {
    const value = values[field.key];
    if (field.kind === 'list') return Array.isArray(value) && value.length > 0;
    return typeof value === 'string' && value.trim().length > 0;
  }).length;
  return { filled, total: required.length };
}

export function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
