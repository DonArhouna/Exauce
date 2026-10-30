import { describe, expect, it } from 'vitest';
import { PUBLICATIONS_MOCK, SERVICES, SECTORS, INTERVENTIONS } from '../data/content.data';
import { PAGE_SLUGS, translatePath } from '../lib/routes';
import type { LocalizedText } from '../types/content';

/**
 * Test de parité bilingue des routes :
 * pour chaque route FR canonique, translatePath(fr→en) doit exister,
 * être unique, ne contenir aucun segment « français pur », et le
 * translatePath(en→fr) inverse doit ramener à la route d'origine.
 */

const FR_ROUTES: string[] = [
  '',
  ...Object.values(PAGE_SLUGS)
    .map((p: LocalizedText) => p.fr)
    .filter(Boolean),
  ...INTERVENTIONS.map((i) => `interventions/${i.slug.fr}`),
  ...SECTORS.flatMap((s) => [`secteurs/${s.slug.fr}`]),
  ...PUBLICATIONS_MOCK.map((p) => `publications/${p.slug.fr}`),
];

describe('Parité des slugs FR ↔ EN', () => {
  it('pour chaque route FR, l’EN existe, est unique et boucle parfaite', () => {
    const enRoutes: string[] = [];
    for (const fr of FR_ROUTES) {
      const en = translatePath(`/fr${fr ? `/${fr}` : ''}`, 'en');
      expect(en, `route ${fr}`).toMatch(/^\/en(\/|$)/);
      const back = translatePath(en, 'fr');
      expect(back, `aller-retour de ${fr}`).toBe(`/fr${fr ? `/${fr}` : ''}`);
      enRoutes.push(en);
    }
    expect(new Set(enRoutes).size).toBe(enRoutes.length);
  });

  it('aucun segment FR-pur ne subsiste sous /en/', () => {
    // Liste blanche des segments identiques dans les deux langues
    const identical = new Set(['services', 'interventions', 'publications', 'contact']);
    // Slugs EN canoniques autorisés (données + pages)
    const allowedEN = new Set([
      ...Object.values(PAGE_SLUGS).map((p) => p.en),
      ...SERVICES.map((f) => f.slug.en),
      ...SERVICES.flatMap((f) => f.domains.map((d) => d.slug.en)),
      ...SECTORS.map((s) => s.slug.en),
      ...INTERVENTIONS.map((i) => i.slug.en),
      ...PUBLICATIONS_MOCK.flatMap((p) => [p.slug.en]),
    ]);
    for (const fr of FR_ROUTES) {
      const en = translatePath(`/fr${fr ? `/${fr}` : ''}`, 'en');
      for (const seg of en.split('/').slice(2)) {
        if (seg === '') continue;
        const isAllowed = identical.has(seg) || allowedEN.has(seg);
        expect(isAllowed, `segment "${seg}" dans ${en}`).toBe(true);
      }
    }
  });

  it('une URL dans la mauvaise langue est traduite (redirection du routeur)', () => {
    expect(translatePath('/en/a-propos', 'en')).toBe('/en/about-us');
    expect(translatePath('/fr/sectors', 'fr')).toBe('/fr/secteurs');
    expect(translatePath('/en/services/accompagnement', 'en')).toBe('/en/services/support');
    expect(translatePath('/fr/services/support', 'fr')).toBe('/fr/services/accompagnement');
  });
});
