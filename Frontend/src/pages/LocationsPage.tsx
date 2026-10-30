import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { MapPin, Phone, Smartphone, MapPinned } from 'lucide-react';
import { Page } from '@/components/layout/Page';
import { PageHero } from '@/components/layout/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { ORGANIZATION } from '@/data/content.data';
import type { Location } from '@/types/content';
import type { Lang } from '@/types/content';

/**
 * Localisations — prête pour plusieurs implantations (tableau d'objets),
 * chaque site attendant ses vraies coordonnées (aucune adresse inventée).
 */
export default function LocationsPage() {
  const { t } = useTranslation();
  const { lang = 'fr' } = useParams();
  const l = lang as Lang;

  /** TODO: adresses réelles à fournir — seule Dakar est confirmée par le docx. */
  const OFFICES: Location[] = [
    {
      id: 'siege-dakar',
      name: { fr: 'Siège — Dakar (Sénégal)', en: 'Head office — Dakar (Senegal)' },
      city: { fr: 'Dakar', en: 'Dakar' },
    },
  ];

  return (
    <Page title={`${t('nav.locations')} — EXAUCE Audit & Conseils`}>
      <PageHero
        title={t('nav.locations')}
        intro={t('locations.introText')}
        crumbs={[{ label: t('nav.locations') }]}
      />

      <section className="py-section-sm md:py-section">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[1.2fr_1fr]">
          {/* Cartes d'implantation */}
          <div className="space-y-6">
            {OFFICES.map((office, i) => (
              <Reveal key={office.id} delay={i * 0.08}>
                <article className="rounded-card border border-ink/8 bg-white p-8 shadow-card">
                  <header className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-turquoise-600" aria-hidden="true" />
                    <h2 className="font-display text-xl">{office.name?.[l]}</h2>
                  </header>
                  {/* Placeholder adresse — aucune invention */}
                  <div className="mt-5 rounded-xl border border-dashed border-turquoise-500/40 bg-turquoise-500/5 p-5">
                    <p className="text-sm text-slate-600">{t('locations.addressesComing')}</p>
                    {office.city && (
                      <p className="mt-2 text-sm font-medium text-turquoise-800">{office.city[l]}</p>
                    )}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          {/* Contacts */}
          <Reveal delay={0.15}>
            <aside className="rounded-card bg-abyss-gradient p-8 text-ivory">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-turquoise-400">
                {t('locations.emailTitle')}
              </p>
              <a href={`mailto:${ORGANIZATION.email}`} className="mt-2 block break-all text-sm text-white/80 hover:text-turquoise-400">
                {ORGANIZATION.email}
              </a>
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-turquoise-400">
                {t('locations.phonesTitle')}
              </p>
              <ul className="mt-3 space-y-2.5 text-sm text-white/80">
                <li>
                  <a href={`tel:${ORGANIZATION.phoneFixed.replace(/\s/g, '')}`} className="inline-flex items-center gap-2.5 hover:text-turquoise-400">
                    <Phone className="h-4 w-4 text-turquoise-500" aria-hidden="true" />
                    {ORGANIZATION.phoneFixed} <span className="text-white/40">({t('locations.fixed')})</span>
                  </a>
                </li>
                <li>
                  <a href={`tel:${ORGANIZATION.phoneMobile.replace(/\s/g, '')}`} className="inline-flex items-center gap-2.5 hover:text-turquoise-400">
                    <Smartphone className="h-4 w-4 text-turquoise-500" aria-hidden="true" />
                    {ORGANIZATION.phoneMobile} <span className="text-white/40">({t('locations.mobile')})</span>
                  </a>
                </li>
              </ul>
            </aside>
          </Reveal>
        </div>
      </section>

      {/* Emplacement carte — statique en attendant les véritables adresses */}
      <section className="pb-section-sm md:pb-section">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <div
              role="img"
              aria-label={t('locations.mapComing')}
              title={t('locations.mapComing')}
              className="relative flex h-72 items-center justify-center overflow-hidden rounded-card border-2 border-dashed border-turquoise-500/40 bg-abyss-gradient text-ivory md:h-96"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(78,185,174,0.18)_0%,transparent_60%)]"
              />
              <div className="absolute text-center">
                <MapPinned className="mx-auto h-10 w-10 text-turquoise-400" aria-hidden="true" />
                <p className="mt-4 text-sm text-white/70">{t('locations.mapComing')}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </Page>
  );
}
