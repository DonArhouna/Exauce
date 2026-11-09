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

  it('conserve les trois modes, leur ordre et les autres données en écriture FR/EN', () => {
    const summary = listPages().find((page) => page.page_key === 'services')!;
    const page = findPage(summary.id)!;
    const section = page.sections.find((entry) => entry.section_type === 'modes')!;
    const originalFr = structuredClone(section.data.fr);
    const originalEn = structuredClone(section.data.en);
    const originalOrderFr = (originalFr.items as { title: string }[]).map((item) => item.title);
    const originalOrderEn = (originalEn.items as { title: string }[]).map((item) => item.title);
    const frItems = (originalFr.items as SectionValues[]).map((item) => ({ ...item }));
    frItems[1].source_reference = 'keep-fr-unknown';
    const frResult = updateSection(section.id, {
      revision: page.revision,
      lang: 'fr',
      data: {
        ...originalFr,
        extra_source_field: 'keep-fr-field',
        items: frItems.map((item, index) =>
          index === 0 ? { ...item, text: 'Texte assistance modifié' } : item,
        ),
      },
    });
    expect(frResult.ok).toBe(true);
    if (!frResult.ok) return;

    const reloadedFr = findPage(summary.id)!.sections.find((entry) => entry.id === section.id)!.data.fr;
    const reloadedFrItems = reloadedFr.items as SectionValues[];
    expect((reloadedFr.items as { title: string }[]).map((item) => item.title)).toEqual(originalOrderFr);
    expect(reloadedFrItems).toHaveLength(3);
    expect(reloadedFrItems[0].text).toBe('Texte assistance modifié');
    expect(reloadedFrItems[1].source_reference).toBe('keep-fr-unknown');
    expect(reloadedFr.extra_source_field).toBe('keep-fr-field');
    expect(findPage(summary.id)!.sections.find((entry) => entry.id === section.id)!.data.en).toEqual(originalEn);

    const currentPage = findPage(summary.id)!;
    const currentSection = currentPage.sections.find((entry) => entry.id === section.id)!;
    const enItems = (currentSection.data.en.items as SectionValues[]).map((item) => ({ ...item }));
    const enResult = updateSection(section.id, {
      revision: currentPage.revision,
      lang: 'en',
      data: {
        ...currentSection.data.en,
        items: enItems.map((item, index) =>
          index === 2 ? { ...item, title: 'Training' } : item,
        ),
      },
    });
    expect(enResult.ok).toBe(true);
    if (!enResult.ok) return;
    const reloadedEn = findPage(summary.id)!.sections.find((entry) => entry.id === section.id)!.data.en;
    expect((reloadedEn.items as { title: string }[]).map((item) => item.title)).toEqual([
      originalOrderEn[0],
      originalOrderEn[1],
      'Training',
    ]);
    expect(reloadedEn).toMatchObject({ title: originalEn.title });
    expect(findPage(summary.id)!.sections.find((entry) => entry.id === section.id)!.data.fr).toEqual(reloadedFr);
  });

  it('recharge et enregistre what_we_do en FR/EN sans perte ni écrasement croisé', () => {
    const summary = listPages().find((page) => page.page_key === 'about')!;
    const page = findPage(summary.id)!;
    const section = page.sections.find((entry) => entry.section_type === 'what_we_do')!;
    const originalFr = structuredClone(section.data.fr);
    const originalEn = structuredClone(section.data.en);
    expect(originalFr.kicker).toBe('Ce que nous faisons');
    expect(originalFr.text).toContain('technologies du numérique');
    expect(originalEn.kicker).toBe('What we do');
    expect(originalEn.text).toContain('digital technologies');

    const fr = updateSection(section.id, {
      revision: page.revision,
      lang: 'fr',
      data: { ...originalFr, kicker: 'Nos activités', text: 'Texte FR aller-retour', unknown: { keep: true } },
    });
    expect(fr.ok).toBe(true);
    if (!fr.ok) return;
    const loadedFr = findPage(summary.id)!.sections.find((entry) => entry.id === section.id)!.data.fr;
    expect(loadedFr).toEqual({ ...originalFr, kicker: 'Nos activités', text: 'Texte FR aller-retour', unknown: { keep: true } });
    expect(findPage(summary.id)!.sections.find((entry) => entry.id === section.id)!.data.en).toEqual(originalEn);

    const freshPage = findPage(summary.id)!;
    const en = updateSection(section.id, {
      revision: freshPage.revision,
      lang: 'en',
      data: { ...originalEn, kicker: 'Our work', text: 'EN round-trip text' },
    });
    expect(en.ok).toBe(true);
    if (!en.ok) return;
    const loaded = findPage(summary.id)!.sections.find((entry) => entry.id === section.id)!;
    expect(loaded.data.en).toEqual({ ...originalEn, kicker: 'Our work', text: 'EN round-trip text' });
    expect(loaded.data.fr).toEqual(loadedFr);
  });

  it('recharge et enregistre founder_card en FR/EN sans perte ni écrasement croisé', () => {
    const summary = listPages().find((page) => page.page_key === 'about')!;
    const page = findPage(summary.id)!;
    const section = page.sections.find((entry) => entry.section_type === 'founder_card')!;
    const originalFr = structuredClone(section.data.fr);
    const originalEn = structuredClone(section.data.en);
    expect(originalFr).toMatchObject({ name: 'Assane KANE', role: expect.stringContaining('Fondateur'), photo_alt: 'Portrait du fondateur — à fournir' });
    expect(originalEn).toMatchObject({ name: 'Assane KANE', role: expect.stringContaining('Founder'), photo_alt: 'Founder portrait — to be provided' });

    const fr = updateSection(section.id, {
      revision: page.revision,
      lang: 'fr',
      data: { ...originalFr, name: 'Assane KANE (modifié)', empty_text: 'Biographie FR modifiée', unknown_field: 'conservé' },
    });
    expect(fr.ok).toBe(true);
    if (!fr.ok) return;
    const loadedFr = findPage(summary.id)!.sections.find((entry) => entry.id === section.id)!.data.fr;
    expect(loadedFr).toEqual({ ...originalFr, name: 'Assane KANE (modifié)', empty_text: 'Biographie FR modifiée', unknown_field: 'conservé' });
    expect(findPage(summary.id)!.sections.find((entry) => entry.id === section.id)!.data.en).toEqual(originalEn);

    const freshPage = findPage(summary.id)!;
    const en = updateSection(section.id, {
      revision: freshPage.revision,
      lang: 'en',
      data: { ...originalEn, empty_text: 'Biography EN modified' },
    });
    expect(en.ok).toBe(true);
    if (!en.ok) return;
    const loaded = findPage(summary.id)!.sections.find((entry) => entry.id === section.id)!;
    expect(loaded.data.en).toEqual({ ...originalEn, empty_text: 'Biography EN modified' });
    expect(loaded.data.fr).toEqual(loadedFr);
  });

  it('recharge steps en FR/EN et préserve ses trois éléments ordonnés à l’aller-retour', () => {
    const summary = listPages().find((page) => page.page_key === 'about')!;
    const page = findPage(summary.id)!;
    const section = page.sections.find((entry) => entry.section_type === 'steps')!;
    const originalFr = structuredClone(section.data.fr);
    const originalEn = structuredClone(section.data.en);
    const frItems = originalFr.items as SectionValues[];
    const enItems = originalEn.items as SectionValues[];
    expect(frItems).toHaveLength(3);
    expect(enItems).toHaveLength(3);
    expect((frItems[0].title as string)).toBe('Un cheminement pas à pas');
    expect((enItems[2].title as string)).toBe('Every kind of organization');

    const reorderedFr = [frItems[1], { ...frItems[0], text: 'Texte FR modifié', preserved: 'unknown' }, frItems[2]];
    const fr = updateSection(section.id, {
      revision: page.revision,
      lang: 'fr',
      data: { ...originalFr, items: reorderedFr },
    });
    expect(fr.ok).toBe(true);
    if (!fr.ok) return;
    const loadedFr = findPage(summary.id)!.sections.find((entry) => entry.id === section.id)!.data.fr;
    expect((loadedFr.items as SectionValues[]).map((item) => item.title)).toEqual([
      'Pilotes par vos savoir-faire', 'Un cheminement pas à pas', "Toutes les formes d'organisation",
    ]);
    expect((loadedFr.items as SectionValues[])[1]).toMatchObject({ text: 'Texte FR modifié', preserved: 'unknown' });
    expect(findPage(summary.id)!.sections.find((entry) => entry.id === section.id)!.data.en).toEqual(originalEn);

    const freshPage = findPage(summary.id)!;
    const reorderedEn = [enItems[0], enItems[2], { ...enItems[1], title: 'Led by your know-how' }];
    const en = updateSection(section.id, {
      revision: freshPage.revision,
      lang: 'en',
      data: { ...originalEn, items: reorderedEn },
    });
    expect(en.ok).toBe(true);
    if (!en.ok) return;
    const loaded = findPage(summary.id)!.sections.find((entry) => entry.id === section.id)!;
    expect((loaded.data.en.items as SectionValues[]).map((item) => item.title)).toEqual([
      'A step-by-step path', 'Every kind of organization', 'Led by your know-how',
    ]);
    expect(loaded.data.fr).toEqual(loadedFr);
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
