import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Mail, Phone, Smartphone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { SpeedLines } from '@/components/ui/SpeedLines';
import { ORGANIZATION } from '@/data/content.data';
import { Lang } from '@/types/content';

/** Section 10 — bandeau CTA final « Parlons de votre projet ». */
export function ContactCtaSection() {
  const { t } = useTranslation();
  const { lang = 'fr' } = useParams();
  const l = lang as Lang;

  return (
    <section className="relative overflow-hidden bg-turquoise-500 py-20 text-ink md:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-turquoise-300/50 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-10%] top-0 h-64 w-64 rounded-full bg-white/30 blur-[90px]"
      />
      <SpeedLines className="absolute right-8 top-8 hidden h-5 opacity-50 md:block" />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 text-ivory sm:px-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <Reveal>
          <h2 className="font-display text-display-lg">{t('home.ctaTitle')}</h2>
          <p className="mt-5 max-w-xl leading-relaxed text-ink/75">{t('home.ctaText')}</p>
          <Button href={`/${l}/contact`} size="lg" className="group mt-8">
            {t('common.contactUs')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Button>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="rounded-card border border-ink/15 bg-white/40 p-7 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink">
              {t('home.ctaSecondary')}
            </p>
            <ul className="mt-5 space-y-4 text-sm text-ink/90">
              <li>
                <a href={`mailto:${ORGANIZATION.email}`} className="inline-flex items-center gap-3 hover:text-ink">
                  <Mail className="h-4 w-4 text-ink/70" aria-hidden="true" />
                  {ORGANIZATION.email}
                </a>
              </li>
              <li>
                <a href={`tel:${ORGANIZATION.phoneFixed.replace(/\s/g, '')}`} className="inline-flex items-center gap-3 hover:text-ink">
                  <Phone className="h-4 w-4 text-ink/70" aria-hidden="true" />
                  {ORGANIZATION.phoneFixed}
                </a>
              </li>
              <li>
                <a href={`tel:${ORGANIZATION.phoneMobile.replace(/\s/g, '')}`} className="inline-flex items-center gap-3 hover:text-ink">
                  <Smartphone className="h-4 w-4 text-ink/70" aria-hidden="true" />
                  {ORGANIZATION.phoneMobile}
                </a>
              </li>
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}


