import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { Page } from '@/components/layout/Page';
import { PageHero } from '@/components/layout/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { Section, Container } from '@/components/ui/Section';
import { ContactCtaSection } from '@/components/sections/ContactCtaSection';

/** À propos — contenu strictement issu du docx (aucune biographie inventée). */
export default function AboutPage() {
  const { t } = useTranslation();
  const howWeWork = [
    { title: t('about.howWork1Title'), text: t('about.howWork1Text') },
    { title: t('about.howWork2Title'), text: t('about.howWork2Text') },
    { title: t('about.howWork3Title'), text: t('about.howWork3Text') },
  ];

  return (
    <Page title={`${t('about.introKicker')} — EXAUCE Audit & Conseils`}>
      <PageHero
        title={t('about.introKicker')}
        intro={t('home.aboutText')}
        crumbs={[{ label: t('about.introKicker') }]}
      />

      {/* Ce que nous faisons */}
      <Section tone="light" className="bg-white">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-turquoise-700">
              {t('about.whatWeDoKicker')}
            </p>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-700">
              {t('about.whatWeDoText')}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            {/* Carte fondateur — portrait en attente */}
            <article className="rounded-card border border-ink/8 bg-white p-8 shadow-card">
              <figure>
                <div
                  role="img"
                  aria-label={t('home.founderPhotoPlaceholder')}
                  className="flex h-28 w-28 items-center justify-center rounded-full border border-dashed border-turquoise-500/50 bg-turquoise-500/5 text-turquoise-700"
                >
                  <span className="font-display text-3xl" aria-hidden="true">AK</span>
                </div>
                <p className="mt-6 font-display text-2xl">{t('home.founder')}</p>
                <p className="mt-1 text-sm text-slate-500">{t('home.founderRole')}</p>
              </figure>
              <p className="mt-5 text-sm text-slate-600">{t('about.founderBioComing')}</p>
            </article>
          </Reveal>
        </div>
      </Section>

      {/* Notre manière de travailler — formulations docx uniquement */}
      <Section tone="turquoise">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-turquoise-800">
            {t('about.howWeWorkKicker')}
          </p>
          <div className="mt-10 space-y-6 max-w-3xl">
            {howWeWork.map((w, i) => (
              <Reveal key={w.title} delay={i * 0.07}>
                <div className="flex gap-4 rounded-card border border-turquoise-600/20 bg-white/70 p-6">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-turquoise-700" aria-hidden="true" />
                  <div>
                    <h3 className="font-display text-xl text-ink">{w.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{w.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* Valeurs — contenu à venir (à valider par le cabinet) */}
      <Section tone="light">
        <Reveal>
          <Container className="!px-0">
            <h2 className="font-display text-display-lg">{t('about.valuesTitle')}</h2>
            <div className="mt-6 rounded-card border border-dashed border-turquoise-500/40 bg-white p-8 shadow-card">
              <p className="text-sm text-slate-600">{t('about.valuesComing')}</p>
            </div>
          </Container>
        </Reveal>
        <div className="mt-10">
          <ContactCtaSection />
        </div>
      </Section>
    </Page>
  );
}
