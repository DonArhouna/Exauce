import { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SpeedLines } from '../ui/SpeedLines';
import { cn } from '@/lib/utils';
import type { NavMegaColumn } from '@/data/navigation';

interface NavMegaDropdownProps {
  label: string;
  href: string;
  badgeKicker: string;
  columns: NavMegaColumn[];
}

/**
 * Composant factorisé de méga-menu / popup déroulant au survol :
 * - Utilisé pour Services et Publications
 * - Délais doux d'ouverture/fermeture (150ms anti-flicker)
 * - Navigation accessible au clavier (focus, Tab, fermeture via Échap avec restitution du focus)
 * - ARIA aria-expanded et aria-haspopup
 */
export function NavMegaDropdown({
  label,
  href,
  badgeKicker,
  columns,
}: NavMegaDropdownProps) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const isClosingRef = useRef(false);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const clearTimer = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const closeDropdown = useCallback(() => {
    clearTimer();
    isClosingRef.current = true;
    setOpen(false);
    triggerRef.current?.focus();
    window.setTimeout(() => {
      isClosingRef.current = false;
    }, 50);
  }, []);

  const handleMouseEnter = () => {
    if (isClosingRef.current) return;
    clearTimer();
    setOpen(true);
  };

  const handleMouseLeave = () => {
    clearTimer();
    timeoutRef.current = window.setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  const handleFocus = () => {
    if (isClosingRef.current) return;
    clearTimer();
    setOpen(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node | null)) {
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeDropdown();
    }
  };

  useEffect(() => {
    if (!open) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDropdown();
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [open, closeDropdown]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <NavLink
        ref={triggerRef}
        to={href}
        className={({ isActive }) =>
          cn(
            'block rounded-full px-4 py-2 text-sm font-medium transition-colors',
            isActive ? 'text-turquoise-900' : 'text-ink/80 hover:text-turquoise-900',
          )
        }
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
      </NavLink>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="absolute left-1/2 top-full w-[42rem] max-w-[85vw] -translate-x-1/2 pt-2"
          >
            <div className="overflow-hidden rounded-card border border-ink/8 bg-white p-6 shadow-cardHover">
              <div className="mb-4 flex items-center gap-3">
                <SpeedLines className="h-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-turquoise-700">
                  {badgeKicker}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {columns.map((col) => (
                  <div key={col.title}>
                    <NavLink
                      to={col.familyHref}
                      className="font-display text-lg text-ink hover:text-turquoise-700"
                      onClick={() => setOpen(false)}
                    >
                      {col.title}
                    </NavLink>
                    <ul className="mt-3 space-y-1.5">
                      {col.items.map((it) => (
                        <li key={it.href}>
                          <NavLink
                            to={it.href}
                            onClick={() => setOpen(false)}
                            className="group flex items-center gap-2 text-sm text-slate-600 hover:text-ink"
                          >
                            <span
                              aria-hidden="true"
                              className="h-px w-3 bg-turquoise-500/60 transition-all group-hover:w-5 group-hover:bg-turquoise-500"
                            />
                            {it.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

