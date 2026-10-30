import { useState } from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, LogIn, Search } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { SpeedLines } from '../ui/SpeedLines';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UtilityBar } from './UtilityBar';
import { useNavItems, useServiceMegaColumns } from '@/data/navigation';
import { useScrolled } from '@/hooks/useScrolled';
import { cn } from '@/lib/utils';
import { Lang } from '@/types/content';
import { pagePath } from '@/lib/routes';

/**
 * Header sticky : barre utilitaire + navigation compacte au scroll,
 * méga-menu « Services » (niveaux 2-3) et menu mobile plein écran.
 */
export function Header({ onSearchOpen }: { onSearchOpen: () => void }) {
  const { lang = 'fr' } = useParams();
  const { t } = useTranslation();
  const scrolled = useScrolled(40);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = useNavItems(lang as Lang);
  const megaColumns = useServiceMegaColumns(lang as Lang);

  return (
    <header className="sticky top-0 z-40">
      <UtilityBar onSearchOpen={onSearchOpen} />

      <div
        className={cn(
          'border-b transition-all duration-300',
          scrolled
            ? 'bg-white/90 shadow-card backdrop-blur-md'
            : 'bg-ivory/90 backdrop-blur-sm border-transparent',
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className={cn('transition-all duration-300', scrolled ? 'py-2' : 'py-4')}>
            <Logo tone="light" lang={lang as Lang} className="block" />
          </div>

          {/* Navigation desktop */}
          <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) =>
              item.mega ? (
                <div
                  key={item.key}
                  className="relative"
                  onMouseEnter={() => setMegaOpen(true)}
                  onMouseLeave={() => setMegaOpen(false)}
                >
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-full px-4 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'text-turquoise-900'
                          : 'text-ink/80 hover:text-turquoise-900',
                      )
                    }
                    aria-expanded={megaOpen}
                    aria-haspopup="true"
                  >
                    {item.label}
                  </NavLink>
                  <AnimatePresence>
                    {megaOpen && (
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
                              {t('nav.services')}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            {megaColumns.map((col) => (
                              <div key={col.title}>
                                <NavLink
                                  to={col.familyHref}
                                  className="font-display text-lg text-ink hover:text-turquoise-700"
                                  onClick={() => setMegaOpen(false)}
                                >
                                  {col.title}
                                </NavLink>
                                <ul className="mt-3 space-y-1.5">
                                  {col.items.map((it) => (
                                    <li key={it.href}>
                                      <NavLink
                                        to={it.href}
                                        onClick={() => setMegaOpen(false)}
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
              ) : (
                <NavLink
                  key={item.key}
                  to={item.href}
                  end={item.key === 'home'}
                  className={({ isActive }) =>
                    cn(
                      'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                      isActive ? 'text-turquoise-900' : 'text-ink/80 hover:text-turquoise-900',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ),
            )}
          </nav>

          {/* Actions mobile */}
          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-full p-2 text-ink hover:bg-ink/5"
              aria-label={t('nav.menu')}
              aria-expanded={mobileOpen}
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Recherche desktop */}
          <button
            type="button"
            onClick={onSearchOpen}
            className="hidden rounded-full border border-ink/10 px-4 py-2 text-sm text-slate-600 hover:border-turquoise-500 hover:text-turquoise-900 lg:flex lg:items-center lg:gap-2"
            aria-label={t('nav.searchLabel')}
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            {t('nav.search')}
          </button>
        </div>
      </div>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        items={navItems}
        lang={lang as Lang}
      />
    </header>
  );
}

function MobileMenu({
  open,
  onClose,
  items,
  lang,
}: {
  open: boolean;
  onClose: () => void;
  items: { key: string; label: string; href: string }[];
  lang: Lang;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const megaColumns = useServiceMegaColumns(lang);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-abyss-gradient text-ivory lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between p-5">
            <Logo tone="dark" lang={lang} />
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-white hover:bg-white/10"
              aria-label={t('nav.close')}
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex flex-col gap-1 px-6 pt-4">
            {items
              .filter((i) => i.key !== 'services')
              .map((item, idx) => (
                <motion.button
                  key={item.key}
                  type="button"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * idx }}
                  className="border-b border-white/10 py-4 text-left font-display text-2xl hover:text-turquoise-400"
                  onClick={() => {
                    onClose();
                    navigate(item.href);
                  }}
                >
                  {item.label}
                </motion.button>
              ))}
            {/* Services + sous-domaines dépliants */}
            {megaColumns.map((col) => (
              <div key={col.title} className="border-b border-white/10 py-4">
                <motion.button
                  type="button"
                  className="text-left font-display text-2xl hover:text-turquoise-400"
                  onClick={() => {
                    onClose();
                    navigate(col.familyHref);
                  }}
                >
                  {col.title}
                </motion.button>
                <ul className="mt-2 space-y-1.5">
                  {col.items.map((it) => (
                    <li key={it.href}>
                      <button
                        type="button"
                        className="text-sm text-turquoise-300 hover:text-turquoise-200"
                        onClick={() => {
                          onClose();
                          navigate(it.href);
                        }}
                      >
                        {it.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <a
              href={pagePath(lang as Lang, 'clientArea')}
              className="mt-6 inline-flex items-center gap-2 text-sm text-turquoise-300"
              onClick={onClose}
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {t('nav.clientArea')}
            </a>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
