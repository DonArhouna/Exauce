import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { AnimatedSpeedBand } from '@/components/ui/Motion';
import { Lang } from '@/types/content';
import { pagePath } from '@/lib/routes';

/** Section 3 — présentation courte du cabinet + fondateur (placeholder photo). */
export function AboutPreviewSection() {
  const { t } = useTranslation();
  const { lang = 'fr' } = useParams();
  const l = lang as Lang;

  return (
    <Section tone="light">
      <div className="grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:items-center">
        <div>
          <Reveal>
            <SectionHeading kicker={t('home.aboutKicker')} title={t('home.aboutTitle')} />
            <p className="mt-8 max-w-xl leading-relaxed text-slate-600">
              {t('home.aboutText')}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <Button href={pagePath(l, 'about')} variant="link" className="group mt-8 !px-0">
              {t('home.aboutCta')}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Button>
          </Reveal>
        </div>

        {/* Carte fondateur */}
        <Reveal delay={0.15}>
          <article className="relative rounded-card border border-ink/8 bg-white p-8 shadow-card">
            <AnimatedSpeedBand className="absolute right-8 top-8 opacity-60" />
            {/* Placeholder portrait — aucune image inventée */}
            <figure>
              <div
                className="flex h-32 w-32 items-center justify-center rounded-full border border-dashed border-turquoise-500/50 bg-turquoise-500/5 text-turquoise-700"
                aria-label={t('home.founderPhotoPlaceholder')}
                role="img"
              >
                <span className="font-display text-3xl" aria-hidden="true">
                  AK
                </span>
              </div>
              <p className="mt-6 font-display text-2xl text-ink">{t('home.founder')}</p>
              <p className="mt-1 text-sm text-slate-500">{t('home.founderRole')}</p>
              <span className="mt-4 inline-block rounded-full bg-champagne/15 px-3 py-1 text-[11px] font-medium tracking-wide text-champagne-700">
                {t('common.placeholder')}
              </span>
            </figure>
          </article>
        </Reveal>
      </div>
    </Section>
  );
}
