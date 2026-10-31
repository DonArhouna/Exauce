import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { usePublicationStream } from '@/hooks/usePublicationStatus';
import { cn } from '@/lib/utils';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

/** Coque : sidebar desktop repliable, navbar, zone de contenu. */
export function AppShell() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useLocalStorageState('exauce.bo.sidebarCollapsed', false);
  usePublicationStream();

  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-control focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink focus:shadow-pop"
      >
        {t('app.skipToContent')}
      </a>

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />

      <div
        className={cn(
          'transition-[padding] duration-200',
          collapsed ? 'lg:pl-[calc(5.25rem+1.5rem)]' : 'lg:pl-[calc(17rem+1.5rem)]',
        )}
      >
        <Navbar />
        <main id="main-content" className="mx-auto w-full max-w-[1600px] px-3 pb-10 pt-4 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
