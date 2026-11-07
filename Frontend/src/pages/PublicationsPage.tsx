import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Film,
  Search as SearchIcon,
  RotateCcw,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Page } from '@/components/layout/Page';
import { PageHero } from '@/components/layout/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { Badge } from '@/components/ui/Card';
import { fetchPublications } from '@/services/api/api';
import { PUBLICATIONS_MOCK, PUBLICATION_CATEGORIES } from '@/data/content.data';
import { pubCover, pubHasVideo, pubMediaCount } from '@/lib/media';
import type { Lang, Publication, PublicationCategory } from '@/types/content';

/** Nombre de publications par page (pagination synchronisée dans l'URL). */
const PAGE_SIZE = 3;

const CAT_LABELS: Record<PublicationCategory, string> = {
  governance: 'governance',
  audit: 'audit',
  finance: 'finance',
  hr: 'hr',
  it: 'it',
  legal: 'legal',
};

/**
 * Publications — liste avec filtres par catégorie et pagination synchronisés
 * dans l'URL, recherche locale, tri par date. Données mockées, backend FastAPI prévu.
 */
export default function PublicationsPage() {
  const { lang = 'fr' } = useParams();
  const l = lang as Lang;
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const catParam = searchParams.get('category');
  const category: PublicationCategory | 'all' =
    catParam && (PUBLICATION_CATEGORIES as readonly string[]).includes(catParam)
      ? (catParam as PublicationCategory)
      : 'all';

  // Chargement via la couche API (mock → HTTP plus tard)
  const publications = useMemo(() => PUBLICATIONS_MOCK.slice().sort((a, b) => b.date.localeCompare(a.date)), []);

  // Simule états loading/erreur du futur backend
  const simulate = async () => {
    setLoading(true);
    setFailed(false);
    try {
      await fetchPublications({});
    } catch {
      setFailed(true);
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return publications.filter(
      (p) =>
        (category === 'all' || p.category === category) &&
        (q.length < 2 || p.title[l].toLowerCase().includes(q) || p.excerpt[l].toLowerCase().includes(q)),
    );
  }, [publications, category, query, l]);

  // Pagination synchronisée dans l'URL (?page=2). La page est bornée au nombre
  // de résultats filtrés : un filtre qui réduit la liste ramène naturellement
  // sur la dernière page valide.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageParam = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.min(pageParam, totalPages) : 1;
  const displayed = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const setPage = (next: number) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next <= 1) nextParams.delete('page');
    else nextParams.set('page', String(next));
    setSearchParams(nextParams, { replace: true });
  };

  const handleCategoryChange = (newCat: PublicationCategory | 'all') => {
    const nextParams = new URLSearchParams(searchParams);
    if (newCat === 'all') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', newCat);
    }
    nextParams.delete('page');
    setSearchParams(nextParams, { replace: true });
    void simulate();
  };

  return (
    <Page title={`${t('nav.publications')} — EXAUCE Audit & Conseils`}>
      <PageHero
        title={t('nav.publications')}
        intro={t('publications.introText')}
        crumbs={[{ label: t('nav.publications') }]}
      />

      <section className="py-section-sm md:py-section">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          {/* Barre filtres + recherche */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2" role="group" aria-label={t('nav.publications')}>
              <button
                type="button"
                onClick={() => handleCategoryChange('all')}
                aria-pressed={category === 'all'}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${category === 'all' ? 'bg-ink text-ivory' : 'bg-white text-slate-600 hover:bg-turquoise-500/10 hover:text-turquoise-800'} border border-ink/10`}
              >
                {t('publications.filterAll')}
              </button>
              {PUBLICATION_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCategoryChange(c)}
                  aria-pressed={category === c}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${category === c ? 'bg-turquoise-600 text-white' : 'bg-white text-slate-600 hover:bg-turquoise-500/10 hover:text-turquoise-800'} border border-ink/10`}
                >
                  {t(`pubCat.${c}`)}
                </button>
              ))}
            </div>
            <label className="relative block w-full max-w-xs">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.delete('page');
                  setSearchParams(nextParams, { replace: true });
                }}
                placeholder={t('publications.searchPlaceholder')}
                aria-label={t('publications.searchPlaceholder')}
                className="w-full rounded-full border border-ink/10 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-turquoise-500 focus:outline-none focus:ring-2 focus:ring-turquoise-500/30"
              />
            </label>
          </div>

          {/* États */}
          {loading && (
            <p className="mt-14 flex items-center gap-2 text-sm text-slate-500" role="status">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t('publications.loading')}
            </p>
          )}
          {failed && (
            <p className="mt-14 flex items-center gap-2 text-sm text-red-700" role="alert">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              {t('publications.error')}
              <button type="button" onClick={() => void simulate()} className="ml-2 underline hover:text-red-900">
                <RotateCcw className="inline h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </p>
          )}
          {!loading && !failed && filtered.length === 0 && (
            <div className="mt-14 rounded-card border border-dashed border-turquoise-500/40 bg-white p-12 text-center shadow-card">
              <BookOpen className="mx-auto h-8 w-8 text-turquoise-600" aria-hidden="true" />
              <p className="mt-4 text-sm text-slate-600">{t('publications.empty')}</p>
            </div>
          )}

          {/* Grille paginée */}
          {!loading && !failed && (
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayed.map((pub, i) => (
                <li key={pub.id} className="h-full">
                  <Reveal delay={(i % 3) * 0.07} className="h-full">
                    <PubCard pub={pub} lang={l} />
                  </Reveal>
                </li>
              ))}
            </ul>
          )}
          {!loading && !failed && totalPages > 1 && (
            <nav
              className="mt-10 flex items-center justify-center gap-4"
              aria-label={t('nav.publications')}
            >
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                aria-label={t('publications.paginationPrev')}
                className="rounded-full border border-ink/15 p-2.5 text-ink transition-colors hover:border-turquoise-500 hover:text-turquoise-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <p className="text-sm text-slate-600" aria-live="polite">
                {t('publications.pageOf', { current: page, total: totalPages })}
              </p>
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                aria-label={t('publications.paginationNext')}
                className="rounded-full border border-ink/15 p-2.5 text-ink transition-colors hover:border-turquoise-500 hover:text-turquoise-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </nav>
          )}
        </div>
      </section>
    </Page>
  );
}

export function PubCard({ pub, lang: l }: { pub: Publication; lang: Lang }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR';
  // Dérivés : jamais stockés dans la donnée (voir lib/media.ts).
  const cover = pubCover(pub);
  const mediaCount = pubMediaCount(pub);
  const hasVideo = pubHasVideo(pub);
  const coverSrc = cover ? (cover.type === 'image' ? cover.src : cover.poster ?? cover.src) : null;

  return (
    <Link
      to={`/${l}/publications/${pub.slug[l]}`}
      className="group flex h-full flex-col rounded-card border border-ink/8 bg-white shadow-card transition-all hover:-translate-y-1 hover:border-turquoise-400/60 hover:shadow-cardHover"
    >
      {/* Couverture (dérivée) + badges média */}
      <div className="relative aspect-video w-full overflow-hidden rounded-t-card bg-slate-900">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={cover?.alt[l] ?? ''}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-turquoise-500/10">
            <BookOpen className="h-9 w-9 text-turquoise-600" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <Badge tone="dark">{t(`pubCat.${pub.category}`) ?? CAT_LABELS[pub.category]}</Badge>
          <div className="flex items-center gap-2">
            {hasVideo && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium text-white"
                aria-label={t('publications.hasVideo')}
              >
                <Film className="h-3.5 w-3.5" aria-hidden="true" />
                <span aria-hidden="true">{t('publications.videoLabel')}</span>
              </span>
            )}
            {mediaCount > 0 && (
              <span className="rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium text-white">
                {t('publications.mediaBadge', { count: mediaCount })}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-7">
        <h2 className="font-display text-xl leading-snug">{pub.title[l]}</h2>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{pub.excerpt[l]}</p>
        <p className="mt-5 text-xs text-slate-500">
          <time dateTime={pub.date}>{new Date(pub.date).toLocaleDateString(locale, { dateStyle: 'long' })}</time>
        </p>
      </div>
    </Link>
  );
}
