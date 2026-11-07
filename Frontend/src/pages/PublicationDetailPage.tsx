import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, BookOpen, Clock3, AlertTriangle } from 'lucide-react';
import { Page } from '@/components/layout/Page';
import { PageHero } from '@/components/layout/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { Badge } from '@/components/ui/Card';
import { MediaGallery } from '@/components/ui/MediaGallery';
import { PUBLICATIONS_MOCK } from '@/data/content.data';
import { resolveFromSlug } from '@/lib/routes';
import { Navigate } from 'react-router-dom';
import type { Lang } from '@/types/content';

/**
 * Détail d'une publication (/publications/:slug) — mise en page de lecture
 * largeur limitée, typographie serif, temps de lecture, placeholder contenu.
 * Corps réel à venir (backend) : body[] ?
 */
export default function PublicationDetailPage() {
  const { lang = 'fr', slug } = useParams();
  const l = lang as Lang;
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR';

  const found = slug ? resolveFromSlug(PUBLICATIONS_MOCK, slug) : null;
  const pub = found?.item ?? null;

  // Slug fourni dans l'autre langue → redirection vers le slug canonique de cette langue
  if (pub && slug && slug !== pub.slug[l]) {
    return <Navigate to={`/${l}/publications/${pub.slug[l]}`} replace />;
  }
  if (!pub) {
    return (
      <Page title={`404 — ${t('notFound.title')}`}>
        <PageHero title={t('notFound.title')} crumbs={[{ label: t('nav.publications'), href: `/${l}/publications` }, { label: slug ?? '' }]} />
        <div className="mx-auto max-w-2xl px-5 py-16 text-center sm:px-8">
          <BookOpen className="mx-auto h-8 w-8 text-turquoise-600" aria-hidden="true" />
          <p className="mt-4 text-sm text-slate-600">{t('publications.empty')}</p>
          <Link to={`/${l}/publications`} className="mt-6 inline-flex items-center gap-2 text-sm text-turquoise-700 hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('nav.publications')}
          </Link>
        </div>
      </Page>
    );
  }

  // Publications liées : même catégorie
  const related = PUBLICATIONS_MOCK.filter((p) => p.id !== pub.id && p.category === pub.category).slice(0, 2);
  const readingMinutes = Math.max(1, Math.round((pub.body?.[l]?.split(/\s+/).length ?? 60) / 200));

  return (
    <Page title={`${pub.title[l]} — EXAUCE Publications`}>
      <PageHero
        title={pub.title[l]}
        crumbs={[
          { label: t('nav.publications'), href: `/${l}/publications` },
          { label: pub.title[l] },
        ]}
      />

      <article className="mx-auto max-w-2xl px-5 py-section-sm sm:px-8 md:py-section">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <Badge>{t(`pubCat.${pub.category}`)}</Badge>
          <time dateTime={pub.date} className="font-medium">
            {new Date(pub.date).toLocaleDateString(locale, { dateStyle: 'long' })}
          </time>
          {pub.author && (
            <span className="inline-flex items-center gap-1.5">
              {t('publications.byAuthor')} {pub.author}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            {readingMinutes} {t('publications.readingTime')}
          </span>
          {/* Marque d'exemple toujours visible */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-champagne/15 px-3 py-1 font-semibold text-champagne-700">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            {t('publications.sampleBadge')}
          </span>
        </div>

        {/* Aperçu */}
        <p className="mt-8 border-l-2 border-turquoise-500 pl-4 font-display text-lg leading-relaxed text-ink">
          {pub.excerpt[l]}
        </p>

        {/* Corps — contenu à venir */}
        {pub.body?.[l] ? (
          <div className="mt-8 space-y-5 font-serif text-[17px] leading-8 text-slate-700">
            {pub.body[l].split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-card border border-dashed border-turquoise-500/40 bg-white p-8 shadow-card">
            <p className="text-sm text-slate-600">{t('publications.bodyComing')}</p>
          </div>
        )}

        {/* Galerie médias — dérivée du tableau `media` (aucun champ stocké) */}
        {pub.media && pub.media.length > 0 && (
          <section className="mt-12" aria-labelledby="pub-media-title">
            <h2 id="pub-media-title" className="font-display text-2xl">
              {t('publications.mediaTitle')}
            </h2>
            <MediaGallery media={pub.media} lang={l} />
          </section>
        )}

        <Link to={`/${l}/publications`} className="mt-12 inline-flex items-center gap-2 text-sm text-turquoise-700 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('nav.publications')}
        </Link>
      </article>

      {/* Publications liées */}
      {related.length > 0 && (
        <section className="bg-white py-section-sm">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <Reveal>
              <h2 className="font-display text-display-md">{t('publications.relatedTitle')}</h2>
              <ul className="mt-8 space-y-4">
                {related.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/${l}/publications/${p.slug[l]}`}
                      className="group block rounded-card border border-ink/8 bg-ivory p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-turquoise-400/60 hover:shadow-cardHover"
                    >
                      <p className="font-display text-lg">{p.title[l]}</p>
                      <p className="mt-2 text-sm text-slate-600">{p.excerpt[l]}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>
      )}
    </Page>
  );
}
