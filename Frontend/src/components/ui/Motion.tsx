import { motion, useReducedMotion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

/**
 * Compteur animé déclenché une seule fois à l'apparition dans le viewport.
 * Respecte prefers-reduced-motion (valeur affichée immédiatement).
 */
export function Counter({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView || reduce) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const duration = 1400;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

/** Dégradé de bande animé (traits de vitesse traversants). */
export function AnimatedSpeedBand({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden="true" className={className}>
      <motion.div
        className="h-1 w-28 rounded-full bg-gradient-to-r from-turquoise-600 to-turquoise-pale"
        initial={reduce ? false : { scaleX: 0, originX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="mt-2 h-1 w-44 rounded-full bg-gradient-to-r from-turquoise-500/70 to-transparent"
        initial={reduce ? false : { scaleX: 0, originX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="mt-2 h-1 w-20 rounded-full bg-gradient-to-r from-turquoise-500/40 to-transparent"
        initial={reduce ? false : { scaleX: 0, originX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
