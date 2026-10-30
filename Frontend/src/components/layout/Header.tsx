import { useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, LogIn, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UtilityBar } from './UtilityBar';
import { NavMegaDropdown } from './NavMegaDropdown';
import { useNavItems, type NavItem } from '@/data/navigation';
import { useScrolled } from '@/hooks/useScrolled';
import { cn } from '@/lib/utils';
import { Lang } from '@/types/content';
import { pagePath } from '@/lib/routes';

/**
 * Header sticky : barre utilitaire + navigation compacte au scroll,
 * méga-menus « Services » et « Publications » (popup au survol)
 * et menu mobile plein écran navigable.
 */
export function Header({ onSearchOpen }: { onSearchOpen: () => void }) {
  const { lang = 'fr' } = useParams();
  const { t } = useTranslation();
  const scrolled = useScrolled(40);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = useNavItems(lang as Lang);

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
              item.megaColumns ? (
                <NavMegaDropdown
                  key={item.key}
                  label={item.label}
                  href={item.href}
                  badgeKicker={item.badgeKicker ?? item.label}
                  columns={item.megaColumns}
                />
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
  items: NavItem[];
  lang: Lang;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-abyss-gradient text-ivory lg:hidden"
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
          <nav aria-label="Mobile" className="flex flex-col gap-1 px-6 pb-12 pt-4">
            {items.map((item, idx) =>
              item.megaColumns ? (
                <div key={item.key} className="border-b border-white/10 py-4">
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * idx }}
                    className="text-left font-display text-2xl hover:text-turquoise-400"
                    onClick={() => {
                      onClose();
                      navigate(item.href);
                    }}
                  >
                    {item.label}
                  </motion.button>
                  <div className="mt-3 space-y-4 pl-2">
                    {item.megaColumns.map((col) => (
                      <div key={col.title}>
                        <button
                          type="button"
                          className="text-left text-xs font-semibold uppercase tracking-wider text-turquoise-400 hover:text-turquoise-300"
                          onClick={() => {
                            onClose();
                            navigate(col.familyHref);
                          }}
                        >
                          {col.title}
                        </button>
                        <ul className="mt-1.5 space-y-1.5">
                          {col.items.map((it) => (
                            <li key={it.href}>
                              <button
                                type="button"
                                className="text-sm text-white/80 hover:text-turquoise-200"
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
                  </div>
                </div>
              ) : (
                <motion.button
                  key={item.key}
                  type="button"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * idx }}
                  className="border-b border-white/10 py-4 text-left font-display text-2xl hover:text-turquoise-400"
                  onClick={() => {
                    onClose();
                    navigate(item.href);
                  }}
                >
                  {item.label}
                </motion.button>
              ),
            )}
            <a
              href={pagePath(lang, 'clientArea')}
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
