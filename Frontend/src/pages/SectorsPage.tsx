import { useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Landmark, Briefcase, HeartHandshake, ArrowRight } from 'lucide-react';
import { Page } from '@/components/layout/Page';
import { PageHero } from '@/components/layout/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { SECTORS } from '@/data/content.data';
import type { Lang } from '@/types/content';
import { cn } from '@/lib/utils';

const ICONS = [Landmark, Briefcase, HeartHandshake] as const;

/**
 * Secteurs : intro du docx, trois univers complets (Public / Privé /
 * Non-gouvernemental) avec ancres (#public|prive|non-gouvernemental),
 * sous-catégories en cartes (libellés du docx uniquement).
 */
export default function SectorsPage() {
  const { lang = 'fr', secteurSlug } = useParams();
  const l = lang as Lang;
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    // /secteurs/:slug → défilement doux vers l'univers correspondant
    if (!secteurSlug) return;
    const target = SECTORS.find((s) => s.slug[l] === secteurSlug || s.id === secteurSlug);
    if (target) {
      document.getElementById(target.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [secteurSlug, l, location]);

  return (
    <Page title={`${t('nav.sectors')} — EXAUCE Audit & Conseils`}>
      <PageHero
        title={t('nav.sectors')}
        intro={t('services.indexText')}
        crumbs={[{ label: t('nav.sectors') }]}
      />

      <section className="py-section-sm md:py-section">
        <div className="mx-auto max-w-6xl space-y-16 px-5 sm:px-8">
          {SECTORS.map((sector, i) => {
            const Icon = ICONS[i % 3];
            const dark = i === 0;
            return (
              <Reveal key={sector.id}>
                <article
                  id={sector.id}
                  className={cn(
                    'grid gap-8 rounded-card p-8 scroll-mt-36 md:grid-cols-[14rem_1fr] md:p-12',
                    dark
                      ? 'bg-abyss-gradient text-ivory shadow-glow'
                      : 'border border-ink/10 bg-white shadow-card',
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
                    <span
                      className={cn(
                        'font-display text-4xl opacity-40',
                        dark ? 'text-turquoise-400' : 'text-turquoise-600/50',
                      )}
                      aria-hidden="true"
                    >
                      0{i + 1}
                    </span>
                    <h2 className={cn('font-display text-display-md', !dark && 'text-ink')}>
                      {sector.title[l]}
                    </h2>
                  </div>
                  <div>
                    <p className={cn('max-w-2xl leading-relaxed', dark ? 'text-white/75' : 'text-slate-600')}>
                      {sector.intro[l]}
                    </p>
                    {/* Sous-catégories — libellés du docx, sans description inventée */}
                    <p className={cn('mt-8 text-[11px] font-semibold uppercase tracking-[0.2em]', dark ? 'text-turquoise-400' : 'text-turquoise-700')}>
                      {t('services.prestations')} — {sector.categories.length}
                    </p>
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {sector.categories.map((cat, ci) => (
                        <li
                          key={cat.id}
                          className={cn(
                            'flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium transition-all hover:-translate-y-0.5',
                            dark
                              ? 'border-white/10 bg-white/5 text-white/85 hover:border-turquoise-400/50'
                              : 'border-ink/8 bg-ivory text-ink hover:border-turquoise-400/70 hover:shadow-card',
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={cn('font-display text-lg', dark ? 'text-turquoise-400/60' : 'text-turquoise-600/60')}
                          >
                            {i + 1}.{ci + 1}
                          </span>
                          {cat.title[l]}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="pb-section-sm md:pb-section">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <div className="rounded-card bg-turquoise-500 p-8 text-ink md:p-12">
              <h2 className="font-display text-display-md">{t('common.contactUs')}</h2>
              <p className="mt-3 max-w-xl text-sm text-ink/80">{t('services.ctaDomainText')}</p>
              <Link
                to={`/${l}/contact`}
                className="group mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-ivory hover:bg-ink-700"
              >
                {t('common.contactUs')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </Page>
  );
}
