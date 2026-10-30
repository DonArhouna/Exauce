import { useTranslation } from 'react-i18next';
import { Lang } from '@/types/content';
import { SERVICES } from '@/data/content.data';
import { PAGE_SLUGS } from '@/lib/routes';

/** Construit un lien vers une page statique via la table de slugs centrale. */
function pageHref(lang: Lang, key: keyof typeof PAGE_SLUGS, extra = '') {
  const seg = PAGE_SLUGS[key][lang];
  return `/${lang}${seg ? `/${seg}` : ''}${extra ? `/${extra}` : ''}`;
}

/**
 * Navigation principale (niveau 1) pilotée par les données + i18n.
 * Les sous-niveaux Services proviennent directement de content.data.
 */
export function useNavItems(lang: Lang) {
  const { t } = useTranslation();
  return [
    { key: 'home', label: t('nav.home'), href: `/${lang}` },
    { key: 'services', label: t('nav.services'), href: pageHref(lang, 'services'), mega: true },
    { key: 'interventions', label: t('nav.interventions'), href: pageHref(lang, 'interventions') },
    { key: 'sectors', label: t('nav.sectors'), href: pageHref(lang, 'sectors') },
    { key: 'publications', label: t('nav.publications'), href: pageHref(lang, 'publications') },
    { key: 'about', label: t('nav.about'), href: pageHref(lang, 'about') },
    { key: 'contact', label: t('nav.contact'), href: pageHref(lang, 'contact') },
  ];
}

/** Colonnes du méga-menu Services (familles → domaines). */
export function useServiceMegaColumns(lang: Lang) {
  return SERVICES.map((family) => ({
    title: family.title[lang],
    familyHref: `/${lang}/services/${family.slug[lang]}`,
    items: family.domains.map((d) => ({
      label: d.title[lang],
      href: `/${lang}/services/${family.slug[lang]}/${d.slug[lang]}`,
    })),
  }));
}
