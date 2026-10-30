import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, X, CornerDownLeft } from 'lucide-react';
import { SERVICES, SECTORS, INTERVENTIONS, PUBLICATIONS_MOCK } from '@/data/content.data';
import { Lang } from '@/types/content';
import { PAGE_SLUGS, pagePath } from '@/lib/routes';

type PageKey = keyof typeof PAGE_SLUGS;
const PAGE_HREFS = (l: Lang): Record<keyof typeof PAGE_SLUGS, string> => ({
  home: `/${l}`,
  locations: pagePath(l, 'locations'),
  services: pagePath(l, 'services'),
  interventions: pagePath(l, 'interventions'),
  sectors: pagePath(l, 'sectors'),
  publications: pagePath(l, 'publications'),
  about: pagePath(l, 'about'),
  contact: pagePath(l, 'contact'),
  clientArea: pagePath(l, 'clientArea'),
  legal: pagePath(l, 'legal'),
});

/**
 * Overlay de recherche plein écran — filtrage local
 * (pages, services, secteurs, interventions, publications).
 */
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { lang = 'fr' } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const l = lang as Lang;

  useEffect(() => {
    if (open) {
      setQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const pool: { label: string; href: string; group: string }[] = [];

    // Pages statiques
    Object.keys(PAGE_HREFS(l)).forEach((key) => pool.push({ label: t(`nav.${key}`), href: PAGE_HREFS(l)[key as PageKey], group: t('nav.menu') }));

    // Services : familles + domaines + prestations individuelles (niveau 4)
    for (const family of SERVICES) {
      pool.push({ label: family.title[l], href: `/${l}/services/${family.slug[l]}`, group: t('nav.services') });
      for (const d of family.domains) {
        pool.push({ label: d.title[l], href: `/${l}/services/${family.slug[l]}/${d.slug[l]}`, group: t('nav.services') });
        for (const g of d.groups) {
          pool.push({ label: g.title[l], href: `/${l}/services/${family.slug[l]}/${d.slug[l]}#${d.slug[l]}/${g.slug[l]}`, group: `${t('nav.services')} — ${d.title[l]}` });
          for (const item of g.items) {
            pool.push({ label: item[l], href: `/${l}/services/${family.slug[l]}/${d.slug[l]}#${d.slug[l]}/${g.slug[l]}`, group: `${t('nav.services')} — ${d.title[l]}` });
          }
        }
      }
    }

    // Secteurs
    for (const s of SECTORS) pool.push({ label: s.title[l], href: `${PAGE_HREFS(l).sectors}/${s.slug[l]}`, group: t('nav.sectors') });

    // Interventions
    for (const i of INTERVENTIONS) pool.push({ label: i.title[l], href: `/${l}/interventions/${i.slug[l]}`, group: t('nav.interventions') });

    // Publications (mock)
    for (const p of PUBLICATIONS_MOCK) pool.push({ label: p.title[l], href: `/${l}/publications/${p.slug[l]}`, group: t('nav.publications') });

    return pool.filter((p) => p.label.toLowerCase().includes(q)).slice(0, 12);
  }, [query, l, t]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/95 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={t('nav.searchLabel')}
      onClick={onClose}
    >
      <div className="mx-auto max-w-2xl px-5 pt-24" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 rounded-card border border-white/15 bg-white/5 px-5 py-4">
          <Search className="h-5 w-5 shrink-0 text-turquoise-400" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && results[0]) {
                onClose();
                navigate(results[0].href);
              }
            }}
            placeholder={t('nav.searchPlaceholder')}
            className="w-full bg-transparent text-lg text-white placeholder:text-white/40 focus:outline-none"
            aria-label={t('nav.searchLabel')}
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-white/60 hover:text-white"
            aria-label={t('nav.close')}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {query.trim().length >= 2 && (
          <ul className="mt-6 space-y-1">
            {results.length === 0 && (
              <li className="px-3 py-4 text-sm text-white/60">{t('nav.noResults')}</li>
            )}
            {results.map((r, i) => (
              <li key={`${r.href}-${i}`}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(r.href);
                  }}
                  className="group flex w-full items-center justify-between rounded-lg px-3 py-3 text-left hover:bg-white/5"
                >
                  <span>
                    <span className="block text-sm text-white/90">{r.label}</span>
                    <span className="block text-xs text-turquoise-400">{r.group}</span>
                  </span>
                  <CornerDownLeft className="h-4 w-4 text-white/30 group-hover:text-turquoise-400" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-8 text-center text-xs text-white/30">{t('nav.searchHint')}</p>
      </div>
    </div>
  );
}
