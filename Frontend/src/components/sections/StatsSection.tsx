import { useTranslation } from 'react-i18next';
import { Counter } from '@/components/ui/Motion';
import { SERVICES, SECTORS, INTERVENTIONS } from '@/data/content.data';

/**
 * Section 8 — chiffres animés, uniquement des décomptes structurels réels
 * tirés du docx (pas de chiffre d'activité inventé).
 */
export function StatsSection() {
  const { t } = useTranslation();
  const accompagnement = SERVICES[0]?.id === 'accompagnement' ? SERVICES[0] : SERVICES[1];
  const audit = SERVICES.find((s) => s.id === 'audit-externe');

  const stats = [
    { value: accompagnement?.domains.length ?? 7, label: t('home.statsDomains') },
    { value: audit?.domains.length ?? 3, label: t('home.statsAudit') },
    { value: SECTORS.length, label: t('home.statsSectors') },
    { value: INTERVENTIONS.length, label: t('home.statsInterventions') },
  ];

  return (
    <section className="bg-ink py-16 text-ivory md:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-turquoise-400">
          {t('home.statsKicker')}
        </p>
        <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="border-l border-turquoise-500/30 pl-5">
              <dd className="font-display text-5xl text-turquoise-400 md:text-6xl">
                <Counter value={s.value} />
              </dd>
              <dt className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-white/60">
                {s.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
