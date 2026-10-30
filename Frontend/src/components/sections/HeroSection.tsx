import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { SpeedLines } from '@/components/ui/SpeedLines';
import { Lang } from '@/types/content';

/**
 * Section 1 — Hero (désigne : version Phase 1 restaurée, à la demande du client).
 * Fond abysse, motif traits de vitesse pâle à droite, accroche + 2 CTA.
 */
export function HeroSection() {
  const { t } = useTranslation();
  const { lang = 'fr' } = useParams();
  const l = lang as Lang;
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-abyss-gradient text-ivory">
      {/* Motif traits de vitesse en fond, très pâle */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-1/2 -translate-y-1/2 rotate-12 opacity-[0.07]"
      >
        <SpeedLines className="h-64" tone="white" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 md:py-32">
        <RevealSpeedless reveal={!reduce} tone="speed">
          <SpeedLines className="h-4" />
        </RevealSpeedless>
        <RevealSpeedless reveal={!reduce} tone="title">
          <h1 className="mt-8 max-w-3xl font-display text-display-xl text-ivory">
            {t('home.heroBrand1')}{' '}
            <em className="italic text-turquoise-400">{t('home.heroBrand2')}</em>
          </h1>
        </RevealSpeedless>
        <RevealSpeedless reveal={!reduce} tone="text">
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/70">
            {t('home.heroSub')}
          </p>
        </RevealSpeedless>
        <RevealSpeedless reveal={!reduce} tone="actions">
          <div className="mt-10 flex flex-wrap gap-4">
            <Button href={`/${l}/contact`} size="lg" className="group">
              {t('common.contactUs')}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Button>
            <Button href={`/${l}/services`} variant="onDark" size="lg" className="group">
              {t('common.ourServices')}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </Button>
          </div>
        </RevealSpeedless>
      </div>
    </section>
  );
}

/** Petite variante de Reveal avec délais escaladés, adaptée au hero. */
function RevealSpeedless({
  children,
  reveal,
  tone,
}: {
  children: React.ReactNode;
  reveal: boolean;
  tone: 'speed' | 'title' | 'text' | 'actions';
}) {
  const delays = { speed: 0, title: 0.08, text: 0.16, actions: 0.24 } as const;
  return (
    <motion.div
      initial={reveal ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delays[tone], ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
