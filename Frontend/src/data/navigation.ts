import { useTranslation } from 'react-i18next';
import { Lang } from '@/types/content';
import { SERVICES, PUBLICATION_CATEGORIES } from '@/data/content.data';
import { PAGE_SLUGS } from '@/lib/routes';

export interface NavMegaItem {
  label: string;
  href: string;
}

export interface NavMegaColumn {
  title: string;
  familyHref: string;
  items: NavMegaItem[];
}

export interface NavItem {
  key: string;
  label: string;
  href: string;
  badgeKicker?: string;
  megaColumns?: NavMegaColumn[];
}

/** Construit un lien vers une page statique via la table de slugs centrale. */
function pageHref(lang: Lang, key: keyof typeof PAGE_SLUGS, extra = '') {
  const seg = PAGE_SLUGS[key][lang];
  return `/${lang}${seg ? `/${seg}` : ''}${extra ? `/${extra}` : ''}`;
}

/** Colonnes du méga-menu Services (familles → domaines). */
export function useServiceMegaColumns(lang: Lang): NavMegaColumn[] {
  return SERVICES.map((family) => ({
    title: family.title[lang],
    familyHref: `/${lang}/services/${family.slug[lang]}`,
    items: family.domains.map((d) => ({
      label: d.title[lang],
      href: `/${lang}/services/${family.slug[lang]}/${d.slug[lang]}`,
    })),
  }));
}

/** Colonnes du méga-menu Publications (toutes + catégories par thèmes depuis content.data). */
export function usePublicationMegaColumns(lang: Lang): NavMegaColumn[] {
  const { t } = useTranslation();
  const pubPath = pageHref(lang, 'publications');
  const midpoint = Math.ceil(PUBLICATION_CATEGORIES.length / 2);
  const col1Cats = PUBLICATION_CATEGORIES.slice(0, midpoint);
  const col2Cats = PUBLICATION_CATEGORIES.slice(midpoint);

  return [
    {
      title: t('publications.filterAll'),
      familyHref: pubPath,
      items: [
        { label: t('publications.filterAll'), href: pubPath },
        ...col1Cats.map((cat) => ({
          label: t(`pubCat.${cat}`),
          href: `${pubPath}?category=${cat}`,
        })),
      ],
    },
    {
      title: t('nav.publications'),
      familyHref: pubPath,
      items: col2Cats.map((cat) => ({
        label: t(`pubCat.${cat}`),
        href: `${pubPath}?category=${cat}`,
      })),
    },
  ];
}

/**
 * Navigation principale (niveau 1) pilotée par les données + i18n.
 * Les sous-niveaux Services et Publications proviennent directement de content.data.
 */
export function useNavItems(lang: Lang): NavItem[] {
  const { t } = useTranslation();
  const serviceColumns = useServiceMegaColumns(lang);
  const publicationColumns = usePublicationMegaColumns(lang);

  return [
    { key: 'home', label: t('nav.home'), href: `/${lang}` },
    {
      key: 'services',
      label: t('nav.services'),
      href: pageHref(lang, 'services'),
      badgeKicker: t('nav.services'),
      megaColumns: serviceColumns,
    },
    { key: 'interventions', label: t('nav.interventions'), href: pageHref(lang, 'interventions') },
    { key: 'sectors', label: t('nav.sectors'), href: pageHref(lang, 'sectors') },
    {
      key: 'publications',
      label: t('nav.publications'),
      href: pageHref(lang, 'publications'),
      badgeKicker: t('nav.publications'),
      megaColumns: publicationColumns,
    },
    { key: 'about', label: t('nav.about'), href: pageHref(lang, 'about') },
    { key: 'contact', label: t('nav.contact'), href: pageHref(lang, 'contact') },
  ];
}
