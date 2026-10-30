import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import { Page } from '@/components/layout/Page';
import { PageHero } from '@/components/layout/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { SpeedLines } from '@/components/ui/SpeedLines';

/**
 * Mentions légales / confidentialité / cookies — gabarit FR/EN.
 * Texte provisoire clairement marqué « à compléter par le cabinet » :
 * aucune information juridique spécifique rédigée (règle anti-invention).
 */
export default function LegalPage() {
  const { t } = useTranslation();

  const blocks = [
    { title: t('legal.mentions'), body: t('legal.bodyMentions') },
    { title: t('legal.privacy'), body: t('legal.bodyPrivacy') },
    { title: t('legal.cookies'), body: t('legal.bodyCookies') },
  ];

  return (
    <Page title={`${t('legal.mentions')} — EXAUCE Audit & Conseils`}>
      <PageHero title={t('legal.mentions')} crumbs={[{ label: t('legal.mentions') }]} />

      <section className="py-section-sm md:py-section">
        <div className="mx-auto max-w-3xl space-y-8 px-5 sm:px-8">
          {blocks.map((b, i) => (
            <Reveal key={b.title} delay={i * 0.07}>
              <article className="rounded-card border border-ink/8 bg-white p-8 shadow-card">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-display text-display-md">{b.title}</h2>
                  <FileText className="h-6 w-6 text-turquoise-600" aria-hidden="true" />
                </div>
                <span className="mt-4 inline-flex rounded-full bg-champagne/15 px-3 py-1 text-[11px] font-semibold text-champagne-700">
                  {t('legal.toComplete')}
                </span>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">{b.body}</p>
              </article>
            </Reveal>
          ))}
          <Reveal>
            <SpeedLines className="h-4 opacity-60" />
          </Reveal>
        </div>
      </section>
    </Page>
  );
}
