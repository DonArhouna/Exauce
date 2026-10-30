import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { PUBLICATIONS_MOCK } from '@/data/content.data';
import { Lang } from '@/types/content';
import { Badge } from '@/components/ui/Card';

const CAT_LABELS: Record<string, { fr: string; en: string }> = {
  governance: { fr: 'Gouvernance', en: 'Governance' },
  audit: { fr: 'Audit', en: 'Audit' },
  finance: { fr: 'Finance', en: 'Finance' },
  hr: { fr: 'RH', en: 'HR' },
  it: { fr: 'Systèmes', en: 'IT' },
  legal: { fr: 'Juridique', en: 'Legal' },
};

/** Section 9 — aperçu des publications (mockées, branchées plus tard). */
export function PublicationsSection() {
  const { t } = useTranslation();
  const { lang = 'fr' } = useParams();
  const l = lang as Lang;

  // On ne monte que 3 cartes pour l'aperçu
  const sample = PUBLICATIONS_MOCK.slice(0, 3);

  return (
    <Section tone="light" className="bg-white">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <Reveal>
          <SectionHeading kicker={t('home.publicationsKicker')} title={t('home.publicationsTitle')} />
        </Reveal>
        <Reveal delay={0.1}>
          <a
            href={`/${l}/publications`}
            className="group inline-flex items-center gap-2 text-sm font-medium text-turquoise-800 hover:text-turquoise-900"
          >
            {t('home.publicationsAll')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </a>
        </Reveal>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {sample.map((pub, i) => (
          <Reveal key={pub.id} delay={i * 0.08}>
            <article className="group flex h-full flex-col rounded-card border border-ink/8 bg-ivory p-7 shadow-card transition-all hover:-translate-y-1 hover:border-turquoise-400/60 hover:shadow-cardHover">
              <BookOpen className="h-6 w-6 text-turquoise-600" aria-hidden="true" />
              <Badge className="mt-5 w-fit">{CAT_LABELS[pub.category]?.[l] ?? pub.category}</Badge>
              <h3 className="mt-4 font-display text-xl leading-snug">{pub.title[l]}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                {pub.excerpt[l]}
              </p>
              <p className="mt-5 text-xs text-slate-400">{t('home.publicationsPlaceholder')}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
