import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { CalendarCheck, Zap } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { INTERVENTIONS } from '@/data/content.data';
import { Lang } from '@/types/content';
import { cn } from '@/lib/utils';

/** Section 6 — interventions récurrentes / ponctuelles, panneaux contrastés. */
export function InterventionsSection() {
  const { t } = useTranslation();
  const { lang = 'fr' } = useParams();
  const l = lang as Lang;

  return (
    <Section tone="turquoise">
      <Reveal>
        <SectionHeading
          kicker={t('home.interventionsKicker')}
          title={t('home.interventionsTitle')}
        />
      </Reveal>
      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        {INTERVENTIONS.map((item, i) => {
          const Icon = i === 0 ? CalendarCheck : Zap;
          const dark = i === 0; // panneau abysse vs clair
          return (
            <Reveal key={item.id} delay={i * 0.1}>
              <article
                className={cn(
                  'flex h-full flex-col rounded-card p-8 md:p-10 transition-shadow duration-300',
                  dark
                    ? 'bg-abyss-gradient text-ivory shadow-glow hover:shadow-cardHover'
                    : 'border border-ink/10 bg-white text-ink shadow-card hover:shadow-cardHover',
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-11 w-11 items-center justify-center rounded-xl',
                    dark ? 'bg-turquoise-500/15 text-turquoise-400' : 'bg-turquoise-500/10 text-turquoise-700',
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-6 font-display text-display-md">
                  {item.title[l]}
                </h3>
                <p
                  className={cn(
                    'mt-4 flex-1 text-sm leading-relaxed',
                    dark ? 'text-white/70' : 'text-slate-600',
                  )}
                >
                  {item.intro[l]}
                </p>
                {/* Phrase signature — mise en exergue */}
                <p className={cn('mt-6 font-display text-lg', dark ? 'text-turquoise-400' : 'text-turquoise-800')}>
                  {t(`home.signature.${i === 0 ? 'grow' : 'contribute'}`)}
                </p>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
