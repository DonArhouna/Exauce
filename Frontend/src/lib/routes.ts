import { Lang, LocalizedText, ServiceFamily, Sector, InterventionType, ServiceDomain } from '@/types/content';
import { SERVICES, SECTORS, INTERVENTIONS, PUBLICATIONS_MOCK } from '@/data/content.data';

/**
 * Utilitaires de routage bilingue à slugs traduits.
 * Routes : /fr/services/accompagnement ↔ /en/services/support.
 */

/** Ordre global des domaines (7 accompagnement + 3 audit) pour la navigation précédent/suivant. */
export const ALL_DOMAINS: { family: ServiceFamily; domain: ServiceDomain }[] = SERVICES.flatMap(
  (family) => family.domains.map((domain) => ({ family, domain })),
);

/** Domaine précédent / suivant dans l'ordre global. */
export function domainNeighbors(id: string): {
  prev?: { family: ServiceFamily; domain: ServiceDomain };
  next?: { family: ServiceFamily; domain: ServiceDomain };
} {
  const idx = ALL_DOMAINS.findIndex((d) => d.domain.id === id);
  if (idx < 0) return {};
  return { prev: ALL_DOMAINS[idx - 1], next: ALL_DOMAINS[idx + 1] };
}

/** Construit un href localisé. */
export function langPath(lang: Lang, path = ''): string {
  return `/${lang}${path ? `/${path}` : ''}`;
}

/** Traduit une entrée d’URL : cherche l’item dont le slug correspond dans n’importe quelle langue. */
export function resolveFromSlug<T extends { slug: LocalizedText; id: string }>(
  items: T[],
  slug: string,
): { item: T; lang: Lang } | null {
  for (const item of items) {
    if (item.slug.fr === slug) return { item, lang: 'fr' };
    if (item.slug.en === slug) return { item, lang: 'en' };
  }
  return null;
}

export function findServiceFamily(slug: string): { family: ServiceFamily; lang: Lang } | null {
  const found = resolveFromSlug(SERVICES, slug);
  return found ? { family: found.item, lang: found.lang } : null;
}

/** Trouve un domaine par slug parmi toutes les familles. */
export function findServiceDomain(slug: string): {
  family: ServiceFamily;
  domain: ServiceDomain;
  lang: Lang;
} | null {
  for (const family of SERVICES) {
    const found = resolveFromSlug(family.domains, slug);
    if (found) return { family, domain: found.item, lang: found.lang };
  }
  return null;
}

export function findSector(slug: string): { sector: Sector; lang: Lang } | null {
  const found = resolveFromSlug(SECTORS, slug);
  return found ? { sector: found.item, lang: found.lang } : null;
}

export function findIntervention(slug: string): { intervention: InterventionType; lang: Lang } | null {
  const found = resolveFromSlug(INTERVENTIONS, slug);
  return found ? { intervention: found.item, lang: found.lang } : null;
}

/* ------------------------------------------------------------------ */
/* TABLE DE SLUGS DES PAGES STATIQUES — source unique (aucune route    */
/* statique codée à part dans les composants).                         */
/* ------------------------------------------------------------------ */
export const PAGE_SLUGS = {
  home: { fr: '', en: '' },
  services: { fr: 'services', en: 'services' },
  interventions: { fr: 'interventions', en: 'interventions' },
  sectors: { fr: 'secteurs', en: 'sectors' },
  publications: { fr: 'publications', en: 'publications' },
  about: { fr: 'a-propos', en: 'about-us' },
  locations: { fr: 'localisations', en: 'locations' },
  legal: { fr: 'mentions-legales', en: 'legal-notice' },
  clientArea: { fr: 'espace-client', en: 'customer-area' },
  contact: { fr: 'contact', en: 'contact' },
} satisfies Record<string, { fr: string; en: string }>;

export type PageSlugKey = keyof typeof PAGE_SLUGS;

/** Construit /{lang}/{segment[key][lang]} pour une page statique. */
export function pagePath(lang: Lang, key: PageSlugKey, extra = ''): string {
  const seg = PAGE_SLUGS[key][lang];
  return `/${lang}${seg ? `/${seg}` : ''}${extra ? `/${extra}` : ''}`;
}

/**
 * Translate a full URL path to the target language using the shared slug table
 * (data slugs via resolveFromSlug + PAGE_SLUGS). Source language is read from
 * the path prefix, so a FR slug is only ever mapped when it belongs to the
 * source language — wrong-language URLs are left untouched (redirectable 404s).
 */
export function translatePath(path: string, target: Lang): string {
  const m = path.match(/^\/(fr|en)(\/.*)?$/);
  if (!m) return path;

  // Dictionnaires orientés une seule fois, sans ambiguïté :
  // frToEn a pour clés les slugs FR canoniques ; enToFr l'inverse.
  const frToEn: Record<string, string> = {};
  const enToFr: Record<string, string> = {};
  const addPair = (slug: LocalizedText) => {
    frToEn[slug.fr] = slug.en;
    enToFr[slug.en] = slug.fr;
  };
  for (const f of SERVICES) {
    addPair(f.slug);
    for (const d of f.domains) addPair(d.slug);
  }
  for (const s of SECTORS) addPair(s.slug);
  for (const i of INTERVENTIONS) addPair(i.slug);
  for (const p of PUBLICATIONS_MOCK) addPair(p.slug);
  for (const pair of Object.values(PAGE_SLUGS)) {
    if (pair.fr && pair.en) {
      frToEn[pair.fr] = pair.en;
      enToFr[pair.en] = pair.fr;
    }
  }

  const dict = target === 'en' ? frToEn : enToFr;
  const rest = (m[2] ?? '')
    .split('/')
    .filter(Boolean)
    .map((seg) => dict[seg] ?? seg);
  return `/${target}${rest.length ? `/${rest.join('/')}` : ''}`;
}

