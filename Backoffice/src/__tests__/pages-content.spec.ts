import { beforeEach, describe, expect, it } from 'vitest';
import {
  listPages,
  findPage,
  pageDetail,
  resetPages,
  transitionPage,
  updatePageContent,
  updatePageSeo,
  updateSection,
} from '@/services/api/mock/pages';
import { listOffices, resetOffices } from '@/services/api/mock/offices';
import type { AdminSection, SectionValues } from '@/services/api/types';
import { PAGE_HEADER_MIGRATION } from './page-header-migration';

/** Recherche le premier champ texte d'un bloc (hors listes), pour l'aller-retour. */
function firstTextField(values: SectionValues): string | null {
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'string') return key;
    if (Array.isArray(value)) {
      const item = value[0];
      if (item && typeof item === 'object') {
        const inner = Object.entries(item as SectionValues).find(([, v]) => typeof v === 'string');
        if (inner) return `${key}.0.${inner[0]}`;
      }
    }
  }
  return null;
}

function readPath(values: SectionValues, path: string): string | null {
  const [head, index, field] = path.split('.');
  if (index === undefined) return typeof values[head] === 'string' ? (values[head] as string) : null;
  const list = values[head];
  if (!Array.isArray(list)) return null;
  const item = list[Number(index)] as SectionValues | undefined;
  const raw = item?.[field];
  return typeof raw === 'string' ? raw : null;
}

function writePath(values: SectionValues, path: string, text: string): SectionValues {
  const [head, index, field] = path.split('.');
  const copy: SectionValues = { ...values };
  if (index === undefined) {
    copy[head] = text;
    return copy;
  }
  const list = Array.isArray(values[head]) ? [...(values[head] as SectionValues[])] : [];
  const item: SectionValues = { ...(list[Number(index)] ?? {}) };
  item[field] = text;
  list[Number(index)] = item;
  copy[head] = list;
  return copy;
}

function sectionById(pageId: string, sectionId: string): AdminSection {
  const page = findPage(pageId);
  const section = page?.sections.find((entry) => entry.id === sectionId);
  if (!page || !section) throw new Error(`bloc ${sectionId} introuvable`);
  return section;
}

describe('contenu réel des pages', () => {
  beforeEach(() => {
    resetPages();
    resetOffices();
  });

  it('décrit les 11 pages du site et leurs 27 blocs après migration des en-têtes', () => {
    const summaries = listPages();
    expect(summaries.map((page) => page.page_key)).toEqual([
      'home',
      'services',
      'interventions',
      'sectors',
      'publications',
      'partners',
      'about',
      'contact',
      'client_area',
      'legal_notice',
      'not_found',
    ]);
    expect(summaries.filter((page) => page.is_in_nav)).toHaveLength(8);
    expect(summaries.reduce((total, page) => total + page.section_count, 0)).toBe(27);

    const pending = summaries
      .filter((page) => findPage(page.id)?.banners_pending)
      .map((page) => page.page_key);
    expect(pending).toEqual(['legal_notice']);

    const partners = summaries.find((page) => page.page_key === 'partners');
    expect(partners?.section_count).toBe(3);

    // Aucune page ne porte plus le bandeau « bientôt disponible ».
    const all = summaries.flatMap((page) => findPage(page.id)?.sections ?? []);
    expect(all.some((section) => section.section_type === 'coming_soon')).toBe(false);
  });

  it('ne perd aucun titre ni aucune introduction des anciens blocs page_header', () => {
    for (const [pageKey, expected] of Object.entries(PAGE_HEADER_MIGRATION)) {
      const summary = listPages().find((page) => page.page_key === pageKey)!;
      const detail = pageDetail(findPage(summary.id)!);
      expect(detail.title).toEqual(expected.title);
      expect(detail.intro).toEqual(expected.intro);
      expect(detail.sections.some((section) => section.section_type === 'page_header')).toBe(false);
    }
  });

  it('charge les titres et descriptions SEO publics réellement définis en FR et EN', () => {
    const byKey = (key: string) => {
      const summary = listPages().find((page) => page.page_key === key)!;
      return pageDetail(findPage(summary.id)!);
    };

    expect(byKey('home').seo_title).toEqual({
      fr: 'EXAUCE Audit & Conseils SAS — Expertise comptable, audit et conseil à Dakar',
      en: 'EXAUCE Audit & Conseils SAS — Accounting, audit and advisory services in Dakar',
    });
    expect(byKey('home').seo_description).toEqual({
      fr: 'Cabinet d’expertise comptable, de conseil, d’audit et de formation à Dakar, Sénégal — membre de l’ONECCA du Sénégal.',
      en: 'Accounting, consulting, audit and training firm in Dakar, Senegal — member of the ONECCA of Senegal.',
    });
    expect(byKey('contact').seo_description).toEqual({
      fr: 'Nos implantations et coordonnées directes.',
      en: 'Our locations and direct contact details.',
    });
    expect(byKey('services').seo_title.fr).toBe('Services — EXAUCE Audit & Conseils');
    expect(byKey('services').seo_description).toEqual({ fr: '', en: '' });
    expect(byKey('partners').seo_title).toEqual({ fr: '', en: '' });
  });

  it('enregistre le contenu et le SEO par langue sans modifier l’autre langue', () => {
    const services = listPages().find((page) => page.page_key === 'services')!;
    const detail = pageDetail(findPage(services.id)!);
    const content = updatePageContent(services.id, 'fr', {
      revision: detail.revision,
      intro: 'Introduction française modifiée',
    });
    expect(content.ok).toBe(true);
    if (!content.ok) return;
    expect(content.value.intro.fr).toBe('Introduction française modifiée');
    expect(content.value.intro.en).toBe(detail.intro.en);

    const seo = updatePageSeo(services.id, 'en', {
      revision: content.value.revision,
      seo_title: 'SEO title to confirm',
    });
    expect(seo.ok).toBe(true);
    if (!seo.ok) return;
    expect(seo.value.seo_title.en).toBe('SEO title to confirm');
    expect(seo.value.seo_title.fr).toBe(detail.seo_title.fr);
    expect(seo.value.seo_description).toEqual(detail.seo_description);

    const seoFr = updatePageSeo(services.id, 'fr', {
      revision: seo.value.revision,
      seo_description: 'Description française testée',
    });
    expect(seoFr.ok).toBe(true);
    if (!seoFr.ok) return;
    expect(seoFr.value.seo_description).toEqual({
      fr: 'Description française testée',
      en: detail.seo_description.en,
    });
    expect(seoFr.value.title).toEqual(detail.title);
    expect(seoFr.value.intro).toEqual(content.value.intro);
  });

  it('reprend les textes affichés par le site', () => {
    const home = listPages().find((page) => page.page_key === 'home');
    if (!home) throw new Error('accueil introuvable');
    const detail = pageDetail(findPage(home.id)!);
    const byType = (type: string) => detail.sections.find((section) => section.section_type === type)!;

    expect(byType('hero').data.fr.subtitle).toBe(
      'EXAUCE Audit & Conseils SAS aide ses clients à solutionner leurs problèmes les plus complexes et à améliorer systématiquement leurs performances — tous services basés sur les technologies du numérique.',
    );
    expect(byType('hero').data.en.brand_line2).toBe('Audit & Conseils');

    const trust = byType('trust_bar').data.fr.items as { text: string }[];
    expect(trust).toHaveLength(4);
    expect(trust[0].text).toBe("Inscrite à l'ONECCA du Sénégal");

    const stats = byType('stats').data.fr.items as { value: string; label: string }[];
    expect(stats.map((item) => item.value)).toEqual(['7', '3', '3', '2']);
    expect(stats[0].label).toBe("Domaines d'accompagnement");

    // Les grilles n'ont plus d'introduction : le site n'en affiche pas.
    expect(byType('domains_grid').data.fr).not.toHaveProperty('text');
    expect(byType('audit_grid').data.fr.text).toContain('opinion motivée');

    const services = pageDetail(findPage(listPages().find((page) => page.page_key === 'services')!.id)!);
    const modes = services.sections.find((section) => section.section_type === 'modes')!;
    expect((modes.data.fr.items as unknown[]).length).toBe(3);
    expect((modes.data.fr.items as { title: string }[])[2].title).toBe('Formation');

    const interventions = pageDetail(
      findPage(listPages().find((page) => page.page_key === 'interventions')!.id)!,
    );
    const compare = interventions.sections.find((section) => section.section_type === 'interventions_compare')!;
    const rows = compare.data.fr.rows as { label: string; recurring: string; oneoff: string }[];
    expect(rows).toHaveLength(3);
    expect(rows[0].label).toBe('Finalité pour le client');

    const contact = pageDetail(findPage(listPages().find((page) => page.page_key === 'contact')!.id)!);
    const offices = contact.sections.find((section) => section.section_type === 'offices_grid')!;
    expect(offices.data.fr.intro).toContain('siège à Dakar');
    expect(offices.data.fr.map_empty_text).toContain('Carte statique');
  });

  it('retrouve chaque valeur éditée à son emplacement, page par page, dans les deux langues', () => {
    for (const summary of listPages()) {
      for (const current of summary.section_count ? findPage(summary.id)!.sections : []) {
        const path = firstTextField(current.data.fr);
        expect(path, `${summary.page_key}/${current.section_type} sans champ texte`).not.toBeNull();
        if (!path) continue;

        for (const lang of ['fr', 'en'] as const) {
          const marker = `${summary.page_key}:${current.section_type}:${lang}`;
          const page = findPage(summary.id)!;
          const section = sectionById(summary.id, current.id);
          const result = updateSection(section.id, {
            revision: page.revision,
            lang,
            data: writePath(section.data[lang], path, marker),
          });
          expect(result.ok, `${marker} refusé`).toBe(true);

          const reloaded = sectionById(summary.id, current.id);
          expect(readPath(reloaded.data[lang], path)).toBe(marker);
          // La langue opposée n'est pas touchée par l'écriture.
          const other = lang === 'fr' ? 'en' : 'fr';
          expect(readPath(reloaded.data[other], path)).not.toBe(marker);
        }
      }
    }
  });

  it('ne place pas les bandeaux en attente sur une page autre que legal_notice', () => {
    const home = listPages().find((page) => page.page_key === 'home')!;
    const page = findPage(home.id)!;
    page.status = 'in_review';
    page.submitted_by = 'auteur';
    const result = transitionPage(page.id, 'reject', page.revision, 'relecteur', 'À corriger');
    expect(result.ok).toBe(true);
    expect(findPage(page.id)?.banners_pending).toBe(false);
  });

  it('conserve les sur-titres quand seul le titre est renvoyé', () => {
    const home = listPages().find((page) => page.page_key === 'home')!;
    const page = findPage(home.id)!;
    const grid = page.sections.find((section) => section.section_type === 'domains_grid')!;
    const before = grid.data.fr.kicker;

    const result = updateSection(grid.id, {
      revision: page.revision,
      lang: 'fr',
      data: { ...grid.data.fr, title: 'Sept domaines' },
    });
    expect(result.ok).toBe(true);
    expect(sectionById(home.id, grid.id).data.fr.kicker).toBe(before);
    expect(sectionById(home.id, grid.id).data.fr.title).toBe('Sept domaines');
  });

  it('ne publie qu’un bureau, le siège de Dakar', () => {
    const offices = listOffices();
    expect(offices).toHaveLength(1);
    expect(offices[0].code).toBe('DKR');
    expect(offices[0].is_headquarters).toBe(true);
    expect(offices[0].translations.fr.name).toBe('Siège — Dakar (Sénégal)');
    expect(offices[0].translations.fr.city).toBe('Dakar');
    expect(offices[0].email).toBe('contact@exauceac.com');
  });
});
