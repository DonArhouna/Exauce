import { useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarCheck, Zap, ArrowRight } from 'lucide-react';
import { Page } from '@/components/layout/Page';
import { PageHero } from '@/components/layout/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { SpeedLines } from '@/components/ui/SpeedLines';
import { INTERVENTIONS } from '@/data/content.data';
import type { Lang } from '@/types/content';
import { cn } from '@/lib/utils';

/**
 * Interventions : intro du docx, deux volets (récurrentes / ponctuelles) avec
 * ancres /interventions#recurrentes | #ponctuelles (routées aussi /interventions/:slug),
 * comparatif sobre, CTA contact.
 */
export default function InterventionsPage() {
  const { lang = 'fr', typeSlug } = useParams();
  const l = lang as Lang;
  const { t } = useTranslation();
  const location = useLocation();

  // /interventions/recurrentes → ancre fluide au chargement
  useEffect(() => {
    if (!typeSlug) return;
    const hash = typeSlug === 'recurrentes' || typeSlug === 'ponctuelles' ? typeSlug : null;
    if (hash) {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [typeSlug, location]);

  return (
    <Page title={`${t('nav.interventions')} — EXAUCE Audit & Conseils`}>
      <PageHero
        title={t('nav.interventions')}
        intro={t('interventions.introText')}
        crumbs={[{ label: t('nav.interventions') }]}
      />

      {/* ── Volets ───────────────────────────────── */}
      <section className="py-section-sm md:py-section">
        <div className="mx-auto max-w-6xl space-y-8 px-5 sm:px-8">
          {INTERVENTIONS.map((item, i) => {
            const Icon = i === 0 ? CalendarCheck : Zap;
            const dark = i === 0;
            return (
              <Reveal key={item.id}>
                <article
                  id={item.id}
                  className="scroll-mt-36"
                >
                  <div
                    className={cn(
                      'grid gap-8 rounded-card p-8 md:grid-cols-[14rem_1fr] md:p-12',
                      dark ? 'bg-abyss-gradient text-ivory shadow-glow' : 'border border-ink/10 bg-white shadow-card',
                    )}
                  >
                    <div className="flex flex-row items-center gap-4 md:flex-col md:items-start">
                      <span
                        className={cn(
                          'inline-flex h-12 w-12 items-center justify-center rounded-xl',
                          dark ? 'bg-turquoise-500/15 text-turquoise-400' : 'bg-turquoise-500/10 text-turquoise-700',
                        )}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <h2 className={cn('font-display text-display-md', i === 1 && 'text-ink')}>
                        {item.title[l]}
                      </h2>
                      <SpeedLines className={cn('mb-11 hidden h-4 md:block', !dark && 'opacity-80')} />
                    </div>
                    <div>
                      <p className={cn('max-w-2xl leading-relaxed', dark ? 'text-white/75' : 'text-slate-600')}>
                        {item.intro[l]}
                      </p>
                      {/* Phrase signature mise en exergue */}
                      <p
                        className={cn(
                          'mt-6 border-l-2 pl-4 font-display text-xl leading-snug',
                          dark ? 'border-turquoise-500/50 text-turquoise-400' : 'border-turquoise-500 text-turquoise-800',
                        )}
                      >
                        {t(`home.signature.${i === 0 ? 'grow' : 'contribute'}`)}
                      </p>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── Comparatif ───────────────────────────── */}
      <section className="bg-white py-section-sm md:pb-section">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <h2 className="font-display text-display-lg">{t('interventions.compareTitle')}</h2>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="mt-10 overflow-x-auto rounded-card border border-ink/8 shadow-card">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <caption className="sr-only">{t('interventions.compareTitle')}</caption>
                <thead>
                  <tr className="bg-ink text-ivory">
                    <th scope="col" className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.15em]">
                      {t('interventions.compareHead')}
                    </th>
                    {INTERVENTIONS.map((it) => (
                      <th key={it.id} scope="col" className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-turquoise-400">
                        {it.title[l]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-slate-600">
                  {(
                    [
                      ['rowFocus', 'rowFocusR', 'rowFocusP'],
                      ['rowAction', 'rowActionR', 'rowActionP'],
                      ['rowHeart', 'rowHeartR', 'rowHeartP'],
                    ] as const
                  ).map(([head, rKey, pKey], ri) => (
                    <tr key={head} className={ri % 2 === 0 ? 'bg-white' : 'bg-ivory'}>
                      <th scope="row" className="w-44 border-t border-ink/8 px-5 py-4 align-top text-xs font-semibold uppercase tracking-wide text-turquoise-800">
                        {t(`interventions.${head}`)}
                      </th>
                      <td className="border-t border-ink/8 px-5 py-4 leading-relaxed">{t(`interventions.${rKey}`)}</td>
                      <td className="border-t border-ink/8 px-5 py-4 leading-relaxed">{t(`interventions.${pKey}`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-slate-400">{t('interventions.compareCaption')}</p>
            <Link
              to={`/${l}/contact`}
              className="group mt-10 inline-flex items-center gap-2 rounded-full bg-turquoise-500 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-turquoise-600 hover:text-white"
            >
              {t('common.contactUs')}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>
    </Page>
  );
}

