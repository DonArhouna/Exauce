import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { Mail, PencilLine } from 'lucide-react';
import { Page } from '@/components/layout/Page';
import { PageHero } from '@/components/layout/PageHero';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { ORGANIZATION } from '@/data/content.data';
import { Lang } from '@/types/content';

/** Gabarit partagé des pages en attente de contenu (Phase 4). */
export default function ComingSoonPage({
  navKey,
  crumbs,
}: {
  navKey: string;
  crumbs?: { label: string; href?: string }[];
}) {
  const { t } = useTranslation();
  const { lang = 'fr' } = useParams();
  const l = lang as Lang;

  return (
    <Page title={t(`nav.${navKey}`)}>
      <PageHero
        title={t(`nav.${navKey}`)}
        crumbs={crumbs ?? [{ label: t(`nav.${navKey}`) }]}
      />
      <section className="py-section-sm md:py-section">
        <Reveal>
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <div className="rounded-card border border-dashed border-turquoise-500/40 bg-white p-10 text-center shadow-card">
              <PencilLine className="mx-auto h-10 w-10 text-turquoise-600" aria-hidden="true" />
              <h2 className="mt-6 font-display text-display-md">{t('comingSoon.title')}</h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-600">
                {t('comingSoon.text')}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Button href={`/${l}/contact`}>
                  <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t('comingSoon.cta')}
                </Button>
                <Link to={`/${l}`} className="text-sm text-turquoise-700 hover:underline">
                  {t('notFound.backHome')}
                </Link>
              </div>
              <p className="mt-8 text-xs text-slate-400">{ORGANIZATION.email}</p>
            </div>
          </div>
        </Reveal>
      </section>
    </Page>
  );
}
