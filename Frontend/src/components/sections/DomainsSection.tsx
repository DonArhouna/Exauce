import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Compass, Gavel, Landmark, LineChart, Wallet, Cpu, ArrowUpRight } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { SERVICES } from '@/data/content.data';
import { Lang } from '@/types/content';
import { cn } from '@/lib/utils';

/** Icônes Lucide par domaine (trait fin, cohérent). */
const DOMAIN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  gouvernance: Landmark,
  'organisation-strategie': Compass,
  'audit-controle-interne': Gavel,
  'systeme-information': Cpu,
  'gestion-financiere': Wallet,
  'juridique-fiscale': Building2,
  'gestion-rh': LineChart,
};

/**
 * Section 4 — les 7 domaines d'accompagnement + mise en avant Audit externe (5).
 * Cartes premium pilotées par content.data.ts.
 */
export function DomainCardsSection() {
  const { t } = useTranslation();
  const { lang = 'fr' } = useParams();
  const l = lang as Lang;
  const [accompagnement, audit] = SERVICES;
  if (!accompagnement || accompagnement.id !== 'accompagnement') return null;

  return (
    <Section tone="light" className="bg-white">
      {/* ── Domaines d'accompagnement ── */}
      <Reveal>
        <SectionHeading
          kicker={t('home.domainsKicker')}
          title={t('home.domainsTitle')}
          id="domaines"
        />
      </Reveal>
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {accompagnement.domains.map((domain, i) => {
          const Icon = DOMAIN_ICONS[domain.id] ?? Compass;
          return (
            <Reveal key={domain.id} delay={(i % 3) * 0.07}>
              <Link
                to={`/${l}/services/accompagnement/${domain.slug[l]}`}
                className={cn(
                  'group relative flex h-full flex-col rounded-card border border-ink/8 bg-ivory p-7',
                  'shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-turquoise-400/70 hover:shadow-cardHover',
                )}
                aria-label={`${domain.title[l]} — ${t('common.learnMore')}`}
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-turquoise-500/10 text-turquoise-700 transition-colors group-hover:bg-turquoise-500 group-hover:text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-[1.35rem] leading-snug text-ink">
                  {domain.title[l]}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                  {domain.intro[l]}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-turquoise-700">
                  {t('common.learnMore')}
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
                {/* filet turquoise révélé au survol */}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-7 bottom-0 h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-turquoise-500 to-turquoise-pale transition-transform duration-300 group-hover:scale-x-100"
                />
              </Link>
            </Reveal>
          );
        })}
        {/* Carte « voir tout » pour compléter la grille (3×3 → 1 carte CTA) */}
        <Reveal delay={0.14}>
          <Link
            to={`/${l}/services`}
            className="group flex h-full min-h-[220px] flex-col justify-between rounded-card bg-abyss-gradient p-7 text-ivory transition-all duration-300 hover:-translate-y-1 hover:shadow-cardHover"
            aria-label={t('common.ourServices')}
          >
            <p className="font-display text-[1.35rem] leading-snug">
              {t('common.ourServices')}
            </p>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 transition-all group-hover:border-turquoise-400 group-hover:text-turquoise-400">
              <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
            </span>
          </Link>
        </Reveal>
      </div>

      {/* ── Audit externe en bloc mis en avant ── */}
      <div className="mt-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-card bg-abyss-gradient p-8 text-ivory md:p-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-turquoise-600/20 blur-[90px]"
            />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-turquoise-400">
                  {t('home.auditKicker')}
                </p>
                <h2 className="mt-4 font-display text-display-md">{t('home.auditTitle')}</h2>
                <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70">
                  {t('home.auditText')}
                </p>
                <Button
                  href={`/${l}/services/${audit.id === 'audit-externe' ? 'audit-externe' : audit.slug.fr}`}
                  variant="onDark"
                  className="group mt-8"
                >
                  {t('common.discover')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Button>
              </div>
              <ul className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {audit.domains.map((d, i) => (
                  <li key={d.id} className="h-full">
                    <Reveal delay={i * 0.08} className="h-full">
                      <Link
                        to={`/${l}/services/audit-externe/${d.slug[l]}`}
                        className="group flex h-full flex-col rounded-xl border border-white/12 bg-white/5 p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-turquoise-400/60"
                      >
                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-champagne">
                          0{i + 1}
                        </span>
                        <span className="mt-3 block font-display text-lg leading-snug">
                          {d.title[l]}
                        </span>
                        <span className="mt-3 flex-1 text-xs leading-relaxed text-white/55">
                          {d.intro[l]}
                        </span>
                        <ArrowRight
                          className="mt-4 h-4 w-4 text-turquoise-400 transition-transform group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </Link>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
