import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pause, Play } from 'lucide-react';
import type { Lang, Partner } from '@/types/content';

interface Props {
  partners: Partner[];
  lang: Lang;
}

export function LogoMarquee({ partners, lang }: Props) {
  const { t } = useTranslation();
  const [paused, setPaused] = useState(false);
  // prefers-reduced-motion
  const prefersReduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    return (
      <div className="flex flex-wrap justify-center gap-6 py-4">
        {partners.map((p) => (
          <img
            key={p.id}
            src={p.logo}
            alt={p.alt[lang]}
            width={120}
            height={60}
            loading="lazy"
            className="h-12 w-auto object-contain"
          />
        ))}
      </div>
    );
  }

  const animStyle: React.CSSProperties = {
    display: 'flex',
    width: 'max-content',
    animation: 'marquee-scroll 30s linear infinite',
    animationPlayState: paused ? 'paused' : 'running',
    willChange: 'transform',
  };
  // Deux groupes identiques : le décalage de -50 % vaut exactement une largeur
  // de groupe → boucle sans coupure (le `paddingRight` referme l'espace).
  const groupStyle: React.CSSProperties = {
    display: 'flex',
    flexShrink: 0,
    gap: '3rem',
    paddingRight: '3rem',
  };

  return (
    <div className="relative">
      {/* Real list (screen readers) */}
      <ul className="sr-only">
        {partners.map((p) => (
          <li key={p.id}>{p.alt[lang]}</li>
        ))}
      </ul>

      {/* Visual marquee */}
      <div
        className="overflow-hidden"
        style={{ maxWidth: '100vw' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <style>{`
          @keyframes marquee-scroll {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
        `}</style>
        <div style={animStyle} aria-hidden="true">
          {[0, 1].map((group) => (
            <div key={group} style={groupStyle}>
              {partners.map((p) => (
                <img
                  key={`${group}-${p.id}`}
                  src={p.logo}
                  alt=""
                  width={120}
                  height={60}
                  loading="lazy"
                  className="h-12 w-auto shrink-0 object-contain"
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pause/Play button */}
      <button
        type="button"
        onClick={() => setPaused((prev) => !prev)}
        className="mt-4 flex items-center gap-2 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-turquoise-500 hover:text-turquoise-700"
        aria-pressed={paused}
        aria-label={paused ? t('partners.playMarquee') : t('partners.pauseMarquee')}
      >
        {paused ? (
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Pause className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {paused ? t('partners.playMarquee') : t('partners.pauseMarquee')}
      </button>
    </div>
  );
}
