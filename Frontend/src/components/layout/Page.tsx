import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router-dom';
import { Lang } from '@/types/content';
import { translatePath } from '@/lib/routes';
import { isLang } from '@/i18n';

/**
 * Enveloppe de page : SEO de base par page (title, meta description,
 * hreflang FR/EN/x-default, Open Graph) + rendu enfants.
 */
export function Page({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const { i18n } = useTranslation();
  const location = useLocation();
  const { lang: langParam } = useParams();
  const lang: Lang = isLang(langParam) ? langParam : 'fr';

  useEffect(() => {
    document.title = title;
    document.documentElement.lang = i18n.language;

    const setMeta = (key: string, content: string, attr: 'name' | 'property' = 'name') => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta('description', description ?? title);

    // Open Graph
    setMeta('og:title', title, 'property');
    setMeta('og:description', description ?? title, 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('og:locale', lang === 'en' ? 'en_GB' : 'fr_FR', 'property');
    setMeta('og:alternate_locale', lang === 'en' ? 'fr_FR' : 'en_GB', 'property');
    setMeta('og:image', '/logo-og.png', 'property');

    // hreflang FR ↔ EN (translated slugs) + x-default + canonical
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const base = translatePath(location.pathname, lang === 'en' ? 'fr' : 'en');
    const [relFr, relEn] = lang === 'en' ? [base, location.pathname] : [location.pathname, base];
    for (const [hl, href] of [['fr', relFr], ['en', relEn], ['x-default', relFr]] as const) {
      let link = document.head.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${hl}"]`);
      if (!link) {
        link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = hl;
        document.head.appendChild(link);
      }
      link.href = `${origin}${href}`;
    }
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${origin}${location.pathname}`;
  }, [title, description, i18n.language, location.pathname, lang]);

  return <>{children}</>;
}
