import { ArrowUpRight, MapPin, Newspaper, PenLine } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { hasAnyPermission } from '@/services/auth/permissions';
import { useAuth } from '@/services/auth/useAuth';

/** Raccourcis filtrés par permission. */
export function ShortcutsCard() {
  const { t } = useTranslation();
  const { permissions } = useAuth();

  const shortcuts = [
    {
      labelKey: 'dashboard.shortcuts.newPublication',
      to: '/publications',
      icon: Newspaper,
      permission: { module: 'publications', action: 'view' },
    },
    {
      labelKey: 'dashboard.shortcuts.editHome',
      to: '/pages',
      icon: PenLine,
      permission: { module: 'pages', action: 'view' },
    },
    {
      labelKey: 'dashboard.shortcuts.addOffice',
      to: '/bureaux',
      icon: MapPin,
      permission: { module: 'offices', action: 'view' },
    },
  ].filter((shortcut) => hasAnyPermission(permissions, shortcut.permission.module, shortcut.permission.action));

  if (shortcuts.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.shortcuts.title')}</CardTitle>
      </CardHeader>
      <CardContent className="pt-1">
        <ul className="space-y-0.5">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <li key={shortcut.to}>
                <Link
                  to={shortcut.to}
                  className="flex items-center gap-2 rounded-control px-2 py-2 text-sm text-ink hover:bg-ivory"
                >
                  <Icon className="h-4 w-4 text-turquoise-700" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{t(shortcut.labelKey)}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
