import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Page } from '@/components/layout/Page';
import { PageHero } from '@/components/layout/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { findServiceDomain, domainNeighbors } from '@/lib/routes';
import type { Lang } from '@/types/content';

/**
 * Template réutilisable des pages domaine (niveaux 3→4) :
 * hero sobre + fil d'Ariane, intro, sommaire latéral sticky (desktop),
 * groupes du niveau 4 numérotés avec toutes leurs prestations,
 * navigation domaine précédent/suivant, CTA contextuel.
 */
export default function ServiceDomainPage() {
  const { lang = 'fr', domaineSlug } = useParams();
  const l = lang as Lang;
  const { t } = useTranslation();

  if (!domaineSlug) return null;
  const found = findServiceDomain(domaineSlug);
  if (!found) {
    return (
      <Page title={`404 — ${t('notFound.title')}`}>
        <PageHero title={t('notFound.title')} crumbs={[{ label: t('nav.services'), href: `/${l}/services` }, { label: domaineSlug }]} />
        <div className="py-16 text-center text-slate-600">{t('notFound.text')}</div>
      </Page>
    );
  }
  const { family, domain } = found;
  const { prev, next } = domainNeighbors(domain.id);

  const prevHref = prev ? `/${l}/services/${prev.family.slug[l]}/${prev.domain.slug[l]}` : null;
  const nextHref = next ? `/${l}/services/${next.family.slug[l]}/${next.domain.slug[l]}` : null;

  return (
    <Page title={`${domain.title[l]} — ${t('nav.services')} · EXAUCE`}>
      <PageHero
        title={domain.title[l]}
        intro={domain.intro[l]}
        crumbs={[
          { label: t('nav.services'), href: `/${l}/services` },
          { label: family.title[l], href: `/${l}/services/${family.slug[l]}` },
          { label: domain.title[l] },
        ]}
      />

      <div className="mx-auto max-w-6xl px-5 py-section-sm sm:px-8 md:py-section">
        <div className="grid gap-12 lg:grid-cols-[16rem_1fr]">
          {/* Sommaire latéral sticky (desktop) */}
          <aside className="hidden lg:block">
            <nav aria-label={t('services.onThisPage')} className="sticky top-40">
              {domain.groups.length > 0 && (
                <>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-turquoise-900">
                    {t('services.onThisPage')}
                  </p>
                  <ul className="mb-8 space-y-2 border-l border-ink/10">
                    {domain.groups.map((g, i) => (
                      <li key={g.id}>
                        <a
                          href={`#${domain.slug[l]}/${g.slug[l]}`}
                          className="-ml-px block border-l-2 border-transparent py-1 pl-3 text-sm text-slate-600 transition-colors hover:border-turquoise-500 hover:text-ink"
                        >
                          {String(i + 1).padStart(2, '0')} · {g.title[l]}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-turquoise-900">
                {t('services.otherDomains')}
              </p>
              <ul className="space-y-2 border-l border-ink/10">
                {family.domains.map((d) => (
                  <li key={d.id}>
                    {d.id === domain.id ? (
                      <span aria-current="page" className="-ml-px block border-l-2 border-turquoise-500 py-1 pl-3 text-sm font-medium text-ink">
                        {d.title[l]}
                      </span>
                    ) : (
                      <Link
                        to={`/${l}/services/${family.slug[l]}/${d.slug[l]}`}
                        className="-ml-px block border-l-2 border-transparent py-1 pl-3 text-sm text-slate-600 transition-colors hover:border-turquoise-500 hover:text-ink"
                      >
                        {d.title[l]}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Contenu : groupes niveau 4 */}
          <div>
            {domain.groups.length === 0 ? (
              <Reveal>
                <p className="max-w-2xl text-lg leading-relaxed text-slate-600">{domain.intro[l]}</p>
              </Reveal>
            ) : (
              <div className="space-y-10">
                {domain.groups.map((group, gi) => (
                  <Reveal key={group.id}>
                    <article id={`${domain.slug[l]}/${group.slug[l]}`} className="scroll-mt-40">
                      <div className="flex items-baseline gap-4">
                        <p className="font-display text-4xl text-turquoise-800" aria-hidden="true">
                          {String(gi + 1).padStart(2, '0')}
                        </p>
                        <div>
                          <h2 className="font-display text-display-md">{group.title[l]}</h2>
                          <span aria-hidden="true" className="mt-2 block h-[2px] w-14 rounded-full bg-gradient-to-r from-turquoise-500 to-transparent" />
                        </div>
                      </div>
                      <p className="mt-5 max-w-2xl leading-relaxed text-slate-600">{group.intro[l]}</p>

                      <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-turquoise-900">
                        {t('services.prestations')} — {group.items.length}
                      </p>
                      <ul className="mt-4 grid gap-x-10 sm:grid-cols-2">
                        {group.items.map((item, ii) => (
                          <li
                            key={ii}
                            className="group/item flex items-start gap-3 border-b border-ink/5 py-3 first:pt-0"
                          >
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-turquoise-600" aria-hidden="true" />
                            <span className="text-sm leading-relaxed text-ink/85">{item[l]}</span>
                            <span className="ml-auto text-[11px] tabular-nums text-slate-600" aria-hidden="true">
                              {String(ii + 1).padStart(2, '0')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  </Reveal>
                ))}
              </div>
            )}

            {/* Navigation précédent / suivant */}
            <nav aria-label={t('services.nextDomain')} className="mt-14 flex items-stretch justify-between gap-4 border-t border-ink/10 pt-8">
              {prevHref && prev ? (
                <Link to={prevHref} className="group flex flex-col text-left text-sm text-slate-600 hover:text-ink">
                  <span className="mb-1 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-turquoise-900">
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                    {t('services.prevDomain')}
                  </span>
                  {prev.domain.title[l]}
                </Link>
              ) : (
                <span aria-hidden="true" />
              )}
              {nextHref && next ? (
                <Link to={nextHref} className="group flex flex-col text-right text-sm text-slate-600 hover:text-ink">
                  <span className="mb-1 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-turquoise-900">
                    {t('services.nextDomain')}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                  {next.domain.title[l]}
                </Link>
              ) : null}
            </nav>

            {/* CTA contextuel */}
            <div className="mt-12">
              <DomainCtaSection domainLabel={domain.title[l]} lang={l} />
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

/** CTA bas de page « Discutons de votre besoin en [domaine] ». */
function DomainCtaSection({ domainLabel, lang }: { domainLabel: string; lang: Lang }) {
  const { t } = useTranslation();
  return (
    <Reveal>
      <div className="rounded-card bg-abyss-gradient p-8 text-ivory md:p-12">
        <span
          aria-hidden="true"
          className="mb-6 block h-[3px] w-16 rounded-full bg-gradient-to-r from-turquoise-500 to-turquoise-pale"
        />
        <h2 className="font-display text-display-md">{t('services.ctaDomain', { domain: domainLabel })}</h2>
        <p className="mt-3 max-w-xl text-sm text-white/70">{t('services.ctaDomainText')}</p>
        <Link
          to={`/${lang}/contact`}
          className="group mt-7 inline-flex items-center gap-2 rounded-full bg-turquoise-500 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-turquoise-400"
        >
          {t('common.contactUs')}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </Reveal>
  );
}
