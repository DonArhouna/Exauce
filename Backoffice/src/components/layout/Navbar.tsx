import { useEffect, useState } from 'react';
import { Menu, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '@/components/ui/Drawer';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Breadcrumbs } from './Breadcrumbs';
import { EditionLanguageSelect } from './EditionLanguageSelect';
import { GlobalSearch } from './GlobalSearch';
import { NotificationMenu } from './NotificationMenu';
import { PublicationStatusPill } from './PublicationStatusPill';
import { PublishButton } from './PublishButton';
import { SidebarContent } from './SidebarContent';
import { UserMenu } from './UserMenu';

/** Barre supérieure : fil d'Ariane, recherche, langue d'édition, publication, compte. */
export function Navbar() {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Le tiroir se referme dès que la largeur desktop est atteinte.
  useEffect(() => {
    if (isDesktop) setDrawerOpen(false);
  }, [isDesktop]);

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 lg:px-6 lg:pt-4">
      <div className="flex h-navbar items-center gap-2 rounded-card border border-line bg-surface px-3 shadow-card">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label={t('nav.openMenu')}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-control text-slate-500 hover:bg-ink/5 hover:text-ink lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <Breadcrumbs />

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label={t('search.open')}
            className="flex h-9 items-center gap-2 rounded-control px-2 text-sm text-slate-500 hover:bg-ink/5 hover:text-ink"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="hidden xl:inline">{t('search.open')}</span>
            <kbd className="hidden rounded border border-line bg-ivory px-1.5 py-0.5 text-[10px] font-medium text-muted xl:inline">
              Ctrl K
            </kbd>
          </button>

          <EditionLanguageSelect />

          <div className="hidden md:block">
            <PublicationStatusPill />
          </div>

          <PublishButton />
          <NotificationMenu />
          <UserMenu />
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={t('nav.mainNavigation')}
      >
        <SidebarContent onNavigate={() => setDrawerOpen(false)} />
      </Drawer>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
