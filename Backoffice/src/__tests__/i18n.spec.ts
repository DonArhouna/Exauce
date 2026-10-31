import fr from '@/i18n/locales/fr.json';
import en from '@/i18n/locales/en.json';

type Json = { [key: string]: string | Json };

/** Aplatit un objet de traduction en chemins de clés triés. */
function flatten(source: Json, prefix = ''): string[] {
  return Object.entries(source).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string' ? [path] : flatten(value, path);
  });
}

function values(source: Json): string[] {
  return Object.values(source).flatMap((value) => (typeof value === 'string' ? [value] : values(value)));
}

describe('i18n', () => {
  it('expose exactement les mêmes clés en FR et EN', () => {
    expect(flatten(en).sort()).toEqual(flatten(fr).sort());
  });

  it('ne contient aucune valeur vide', () => {
    for (const locale of [fr, en]) {
      for (const value of values(locale)) {
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
