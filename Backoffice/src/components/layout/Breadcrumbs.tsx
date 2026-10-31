import { ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_PATH } from '@/lib/navigation';
import { EXTRA_PAGES, findNavItem } from './navigation';

/** Fil d'Ariane : accueil (tableau de bord) puis page courante. */
export function Breadcrumbs() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const item = findNavItem(pathname);
  const labelKey = item?.labelKey ?? EXTRA_PAGES[pathname];
  const current = labelKey ? t(labelKey) : t('nav.dashboard');
  const isDashboard = pathname === DASHBOARD_PATH;

  return (
    <nav aria-label={t('breadcrumb.label')} className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        {!isDashboard ? (
          <>
            <li className="shrink-0">
              <Link to={DASHBOARD_PATH} className="text-muted hover:text-turquoise-700">
                {t('breadcrumb.home')}
              </Link>
            </li>
            <li aria-hidden="true" className="shrink-0 text-slate-300">
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
          </>
        ) : null}
        <li className="min-w-0">
          <span aria-current="page" className="block truncate font-medium text-ink">
            {current}
          </span>
        </li>
      </ol>
    </nav>
  );
}
