import { describe, expect, it } from 'vitest';
import i18n from '../i18n';
import { SERVICES, SECTORS, INTERVENTIONS, PUBLICATIONS_MOCK, PUBLICATION_CATEGORIES } from '../data/content.data';

/**
 * Tests de points critiques — légers, sans réseau :
 * indexation de la recherche (routes FR/EN + prestations niveau 4).
 */

describe('Recherche — index locale', () => {
  it('expose tous les slugs FR et EN des domaines', () => {
    for (const family of SERVICES) {
      for (const domain of family.domains) {
        expect(domain.slug.fr).toMatch(/^[a-z0-9-]+$/);
        expect(domain.slug.en).toMatch(/^[a-z0-9-]+$/);
      }
    }
  });

  it('a au moins 7 domaines d’accompagnement et 3 audits', () => {
    const [accompagnement, audit] = SERVICES;
    expect(accompagnement.id).toBe('accompagnement');
    expect(accompagnement.domains).toHaveLength(7);
    expect(audit.id).toBe('audit-externe');
    expect(audit.domains).toHaveLength(3);
  });

  it('i18n expose les deux langues supportées avec français par défaut', () => {
    expect(i18n.languages).toContain('fr');
    expect(i18n.languages).toContain('en');
    expect(i18n.options.fallbackLng).toContain('fr');
  });
});

describe('Contenu — fidélité au docx', () => {
  it('possède l’intégralité des 94 prestations niveau 4', () => {
    let items = 0;
    for (const family of SERVICES)
      for (const d of family.domains)
        for (const g of d.groups) items += g.items.length;
    expect(items).toBe(94);
  });

  it('contient les prestations sensibles à la recherche (« paie », « OHADA », « cartographie des risques »)', () => {
    const flat = SERVICES.flatMap((f) => f.domains).flatMap((d) => d.groups.flatMap((g) => g.items.map((i) => i.fr.toLowerCase())));
    for (const needle of ['ohada', 'paye', 'externalisation']) {
      expect(flat.some((f) => f.includes(needle))).toBe(true);
    }
    // « Cartographie des risques » est une publication, pas une prestation
    expect(PUBLICATIONS_MOCK.some((p) => p.slug.fr.includes('cartographie-des-risques'))).toBe(true);
  });
});

describe('Référentiels stables', () => {
  it('pas de doublon de slug secteurs / interventions / publications', () => {
    expect(SECTORS).toHaveLength(3);
    expect(INTERVENTIONS).toHaveLength(2);
    expect(new Set(PUBLICATIONS_MOCK.map((p) => p.slug.fr)).size).toBe(PUBLICATIONS_MOCK.length);
    expect(new Set(PUBLICATIONS_MOCK.map((p) => p.slug.en)).size).toBe(PUBLICATIONS_MOCK.length);
  });

  it('définit 6 catégories de publications stables issues des référentiels éditoriaux', () => {
    expect(PUBLICATION_CATEGORIES).toHaveLength(6);
    expect(new Set(PUBLICATION_CATEGORIES).size).toBe(6);
    for (const pub of PUBLICATIONS_MOCK) {
      expect(PUBLICATION_CATEGORIES).toContain(pub.category);
    }
  });
});
