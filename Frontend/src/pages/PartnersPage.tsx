import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { ExternalLink, Info } from 'lucide-react';
import { Page } from '@/components/layout/Page';
import { PageHero } from '@/components/layout/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { LogoMarquee } from '@/components/ui/LogoMarquee';
import { PARTNERS_MOCK } from '@/data/content.data';
import { pagePath } from '@/lib/routes';
import type { Lang } from '@/types/content';

/** Page Partenaires — données fictives, clairement marquées comme telles. */
export default function PartnersPage() {
  const { t } = useTranslation();
  const { lang = 'fr' } = useParams();
  const l = lang as Lang;

  return (
    <Page
      title={t('partners.pageTitle')}
      description={t('partners.seoDescription')}
    >
      <PageHero
        title={t('partners.heroTitle')}
        intro={t('partners.introText')}
        crumbs={[{ label: t('partners.heroTitle') }]}
      />

      {/* Section marquee — Ceux qui nous font confiance (bandeau pleine largeur) */}
      <Section tone="light" className="overflow-hidden bg-white">
        <Reveal>
          <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-turquoise-700">
            {t('partners.trustedTitle')}
          </h2>
          <p className="mt-4 max-w-2xl text-slate-600">{t('partners.trustedIntro')}</p>
        </Reveal>
        <Reveal delay={0.08}>
          {/* Sort du conteneur centré (max-w-6xl) : le bandeau occupe toute la
              largeur ; la section parente `overflow-hidden` empêche tout
              défilement horizontal. */}
          <div className="relative left-1/2 mt-10 w-screen -translate-x-1/2">
            <LogoMarquee partners={PARTNERS_MOCK} lang={l} />
          </div>
        </Reveal>
      </Section>

      {/* Section grille de cartes partenaires */}
      <Section tone="turquoise">
        <Reveal>
          <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-turquoise-800">
            {t('partners.partnersTitle')}
          </h2>
          <p className="mt-4 max-w-2xl text-slate-700">{t('partners.partnersIntro')}</p>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PARTNERS_MOCK.map((partner, i) => (
            <Reveal key={partner.id} delay={i * 0.05}>
              <article className="flex h-full flex-col rounded-card border border-turquoise-600/20 bg-white/70 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-center rounded-md bg-slate-50 p-4">
                  <img
                    src={partner.logo}
                    alt={partner.alt[l]}
                    width={120}
                    height={60}
                    loading="lazy"
                    className="h-12 w-auto object-contain"
                  />
                </div>
                <h3 className="mt-4 font-display text-lg text-ink">{partner.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                  {partner.description[l]}
                </p>
                {partner.url && (
                  <a
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-turquoise-700 hover:text-turquoise-900"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('partners.visitSite')}
                  </a>
                )}
              </article>
            </Reveal>
          ))}
        </div>

        {/* Notice exemples fictifs */}
        <Reveal delay={0.1}>
          <div className="mt-10 flex items-start gap-3 rounded-card border border-turquoise-600/30 bg-white/60 p-5 text-sm text-slate-600">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-turquoise-700" aria-hidden="true" />
            <p>{t('partners.notice')}</p>
          </div>
        </Reveal>
      </Section>

      {/* CTA vers Contact */}
      <Section tone="light" className="bg-white">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-display-lg text-ink">{t('partners.ctaTitle')}</h2>
            <p className="mt-5 leading-relaxed text-slate-600">{t('partners.ctaText')}</p>
            <Button href={pagePath(l, 'contact')} size="lg" className="mt-8">
              {t('partners.ctaButton')}
            </Button>
          </div>
        </Reveal>
      </Section>
    </Page>
  );
}
