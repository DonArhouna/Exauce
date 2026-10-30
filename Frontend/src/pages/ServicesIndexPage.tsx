import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Page } from '@/components/layout/Page';
import { PageHero } from '@/components/layout/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { SERVICES } from '@/data/content.data';
import type { Lang, ServiceGroup, ServiceDomain, ServiceFamily } from '@/types/content';

/**
 * Pages « Services » :
 * - index (/services) : les deux familles en grandes entrées
 * - famille (/services/:famille) : Accompagnement (3 modes + 7 domaines)
 *   ou Audit externe (définition + 3 formes d'intervention)
 */
export default function ServicesIndexPage() {
  const { familleSlug } = useParams();

  const found = familleSlug ? findFamilyBySlug(familleSlug) : null;

  if (found) return <FamilyView family={found} />;
  return <ServicesIndex />;
}

function findFamilyBySlug(slug: string): ServiceFamily | null {
  return SERVICES.find((f) => f.slug.fr === slug || f.slug.en === slug) ?? null;
}

/* ── Index ─────────────────────────────────────────────────────── */
function ServicesIndex() {
  const { lang = 'fr' } = useParams();
  const l = lang as Lang;
  const { t } = useTranslation();
  const accompagnement = SERVICES[0];
  const audit = SERVICES[1];

  return (
    <Page title={`${t('nav.services')} — EXAUCE Audit & Conseils`}>
      <PageHero title={t('nav.services')} intro={t('services.indexText')} crumbs={[{ label: t('nav.services') }]} />
      <section className="py-section-sm md:py-section">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-8 md:grid-cols-2">
          {[accompagnement, audit].map((family, fi) => (
            <Reveal key={family.id} delay={fi * 0.1}>
              <Link
                to={`/${l}/services/${family.slug[l]}`}
                className="group flex h-full flex-col rounded-card border border-ink/8 bg-white p-9 shadow-card transition-all hover:-translate-y-1 hover:border-turquoise-400/60 hover:shadow-cardHover"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-turquoise-700">
                  0{fi + 1} — {t('services.indexKicker')}
                </p>
                <h2 className="mt-4 font-display text-display-md">{family.title[l]}</h2>
                {family.tagline[l] && (
                  <p className="mt-1 text-sm uppercase tracking-wide text-turquoise-800">{family.tagline[l]}</p>
                )}
                <p className="mt-5 flex-1 text-sm leading-relaxed text-slate-600">{family.intro[l]}</p>
                <ul className="mt-6 space-y-1.5">
                  {family.domains.map((d) => (
                    <li key={d.id} className="flex items-center gap-2 text-sm text-slate-500">
                      <span aria-hidden="true" className="h-px w-4 bg-turquoise-500/50" />
                      {d.title[l]}
                    </li>
                  ))}
                </ul>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-turquoise-700">
                  {t('common.discover')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </Page>
  );
}

/* ── Fiche famille ─────────────────────────────────────────────── */
function FamilyView({ family }: { family: ServiceFamily }) {
  const { lang = 'fr' } = useParams();
  const l = lang as Lang;
  const { t } = useTranslation();
  const isAccompagnement = family.id === 'accompagnement';
  const modes = [
    { key: 'Assistance', title: t('services.modeAssistanceTitle'), text: t('services.modeAssistanceText') },
    { key: 'Conseil', title: t('services.modeConseilTitle'), text: t('services.modeConseilText') },
    { key: 'Formation', title: t('services.modeFormationTitle'), text: t('services.modeFormationText') },
  ];

  return (
    <Page title={`${family.title[l]} — EXAUCE Audit & Conseils`}>
      <PageHero
        title={family.title[l]}
        intro={family.intro[l]}
        crumbs={[{ label: t('nav.services'), href: `/${l}/services` }, { label: family.title[l] }]}
      />

      {/* Accompagnement : les 3 modes du docx */}
      {isAccompagnement && (
        <section className="bg-white py-section-sm md:py-section">
          <Reveal>
            <p className="mx-auto max-w-6xl px-5 text-xs font-semibold uppercase tracking-[0.25em] text-turquoise-700 sm:px-8">
              {t('services.modesTitle')}
            </p>
          </Reveal>
          <div className="mx-auto mt-10 grid max-w-6xl gap-6 px-5 sm:px-8 md:grid-cols-3">
            {modes.map((m, i) => (
              <Reveal key={m.key} delay={i * 0.08}>
                <article className="h-full rounded-card border border-ink/8 bg-ivory p-7 shadow-card">
                  <p className="font-display text-4xl text-turquoise-500/40" aria-hidden="true">
                    0{i + 1}
                  </p>
                  <h3 className="mt-3 font-display text-xl">{m.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{m.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Domaines / formes d'intervention */}
      <section className="py-section-sm md:py-section">
        <Reveal>
          <h2 className="mx-auto max-w-6xl px-5 font-display text-display-lg sm:px-8">
            {isAccompagnement ? t('services.domainsTitle') : t('services.auditTypesTitle')}
          </h2>
        </Reveal>
        <div className="mx-auto mt-12 grid max-w-6xl gap-6 px-5 sm:px-8 md:grid-cols-2">
          {family.domains.map((domain: ServiceDomain, i: number) => (
            <Reveal key={domain.id} delay={(i % 2) * 0.07}>
              <Link
                to={`/${l}/services/${family.slug[l]}/${domain.slug[l]}`}
                className="group block h-full rounded-card border border-ink/8 bg-white p-7 shadow-card transition-all hover:-translate-y-0.5 hover:border-turquoise-400/60 hover:shadow-cardHover"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-champagne-700" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-2 font-display text-display-md text-ink">{domain.title[l]}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{domain.intro[l]}</p>
                {domain.groups.length > 0 && (
                  <ul id="domain-groups-preview" className="mt-4 flex flex-wrap gap-1.5">
                    {domain.groups.map((g: ServiceGroup) => (
                      <li key={g.id} className="rounded-full bg-turquoise-500/10 px-2.5 py-1 text-[11px] font-medium text-turquoise-800">
                        {g.title[l]}
                      </li>
                    ))}
                  </ul>
                )}
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-turquoise-700">
                  {t('common.learnMore')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA contextuel */}
      <section className="pb-section-sm md:pb-section">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <DomainCta domainLabel={family.title[l]} lang={l} />
        </div>
      </section>
    </Page>
  );
}

/** CTA bas de page réutilisable. */
export function DomainCta({ domainLabel, lang }: { domainLabel: string; lang: Lang }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-card bg-turquoise-500 p-8 text-ink md:p-12">
      <h2 className="font-display text-display-md">{t('services.ctaDomain', { domain: domainLabel })}</h2>
      <p className="mt-3 max-w-xl text-sm text-ink/80">{t('services.ctaDomainText')}</p>
      <Link
        to={`/${lang}/contact`}
        className="group mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-ivory transition-colors hover:bg-ink-700"
      >
        {t('common.contactUs')}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </Link>
    </div>
  );
}
