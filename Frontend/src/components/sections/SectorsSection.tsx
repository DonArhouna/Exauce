import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { SECTORS } from '@/data/content.data';
import { Lang } from '@/types/content';
import { pagePath } from '@/lib/routes';

const TONE = [
  'bg-abyss-gradient text-ivory',
  'border border-ink/8 bg-white text-ink shadow-card',
  'bg-turquoise-500 text-ink shadow-glow',
] as const;

/** Section 7 — trois univers : Public / Privé / Non-gouvernemental. */
export function SectorsSection() {
  const { t } = useTranslation();
  const { lang = 'fr' } = useParams();
  const l = lang as Lang;

  return (
    <Section tone="light">
      <Reveal>
        <SectionHeading kicker={t('home.sectorsKicker')} title={t('home.sectorsTitle')} />
      </Reveal>
      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {SECTORS.map((sector, i) => (
          <Reveal key={sector.id} delay={i * 0.09}>
            <article
              className={`${TONE[i % 3]} flex h-full flex-col rounded-card p-8 transition-transform duration-300 hover:-translate-y-1`}
            >
              <p
                className={`font-display text-5xl ${i === 1 ? 'text-turquoise-500/30' : i === 2 ? 'text-ink/20' : 'text-white/15'}`}
                aria-hidden="true"
              >
                0{i + 1}
              </p>
              <h3 className="mt-4 font-display text-display-md">{sector.title[l]}</h3>
              <p
                className={`mt-4 flex-1 text-sm leading-relaxed ${i === 0 ? 'text-white/70' : i === 2 ? 'text-ink/75' : 'text-slate-600'}`}
              >
                {sector.intro[l]}
              </p>
              <ul className="mt-6 flex flex-wrap gap-1.5">
                {sector.categories.map((c) => (
                  <li
                    key={c.id}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                      i === 0
                        ? 'bg-white/10 text-turquoise-300'
                        : i === 2
                          ? 'bg-ink/10 text-ink'
                          : 'bg-turquoise-500/10 text-turquoise-800'
                    }`}
                  >
                    {c.title[l]}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.2}>
        <a
          href={pagePath(l, 'sectors')}
          className="group mt-10 inline-flex items-center gap-2 text-sm font-medium text-turquoise-800 hover:text-turquoise-900"
        >
          {t('common.discover')}
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </a>
      </Reveal>
    </Section>
  );
}
