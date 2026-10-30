import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Search as SearchIcon, RotateCcw, Loader2, AlertTriangle } from 'lucide-react';
import { Page } from '@/components/layout/Page';
import { PageHero } from '@/components/layout/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { Badge } from '@/components/ui/Card';
import { fetchPublications } from '@/services/api/api';
import { PUBLICATIONS_MOCK } from '@/data/content.data';
import type { Lang, Publication, PublicationCategory } from '@/types/content';

const CAT_LABELS: Record<PublicationCategory, string> = {
  governance: 'governance',
  audit: 'audit',
  finance: 'finance',
  hr: 'hr',
  it: 'it',
  legal: 'legal',
};

/** Métadonnées partagées des catégories (libellés FR/EN depuis i18n). */
const CATEGORIES: PublicationCategory[] = ['governance', 'audit', 'finance', 'hr', 'it', 'legal'];

/**
 * Publications — liste avec filtres par catégorie, recherche locale,
 * tri par date, « charger plus ». Données mockées, backend FastAPI prévu.
 */
export default function PublicationsPage() {
  const { lang = 'fr' } = useParams();
  const l = lang as Lang;
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<PublicationCategory | 'all'>('all');
  const [visible, setVisible] = useState(6);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

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
                onClick={() => { setCategory('all'); setVisible(6); }}
                aria-pressed={category === 'all'}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${category === 'all' ? 'bg-ink text-ivory' : 'bg-white text-slate-600 hover:bg-turquoise-500/10 hover:text-turquoise-800'} border border-ink/10`}
              >
                {t('publications.filterAll')}
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setCategory(c); setVisible(6); void simulate(); }}
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
                onChange={(e) => { setQuery(e.target.value); setVisible(6); }}
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

          {/* Grille */}
          {!loading && !failed && (
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.slice(0, visible).map((pub, i) => (
                <li key={pub.id} className="h-full">
                  <Reveal delay={(i % 3) * 0.07} className="h-full">
                    <PubCard pub={pub} lang={l} />
                  </Reveal>
                </li>
              ))}
            </ul>
          )}
          {!loading && !failed && filtered.length > visible && (
            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={() => setVisible((v) => v + 6)}
                className="rounded-full border border-ink/15 px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-turquoise-500 hover:text-turquoise-700"
              >
                {t('publications.loadMore')}
              </button>
            </div>
          )}
        </div>
      </section>
    </Page>
  );
}

export function PubCard({ pub, lang: l }: { pub: Publication; lang: Lang }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR';
  return (
    <Link
        to={`/${l}/publications/${pub.slug[l]}`}
        className="group flex h-full flex-col rounded-card border border-ink/8 bg-white p-7 shadow-card transition-all hover:-translate-y-1 hover:border-turquoise-400/60 hover:shadow-cardHover"
      >
        <div className="flex items-center justify-between">
          <BookOpen className="h-6 w-6 text-turquoise-600" aria-hidden="true" />
          <Badge tone="light">{t(`pubCat.${pub.category}`) ?? CAT_LABELS[pub.category]}</Badge>
        </div>
        <h2 className="mt-5 font-display text-xl leading-snug">{pub.title[l]}</h2>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{pub.excerpt[l]}</p>
        <p className="mt-5 text-xs text-slate-500">
          <time dateTime={pub.date}>{new Date(pub.date).toLocaleDateString(locale, { dateStyle: 'long' })}</time>
        </p>
      </Link>
  );
}
