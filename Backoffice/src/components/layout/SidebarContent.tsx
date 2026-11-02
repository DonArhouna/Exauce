import { ChevronsLeft } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/ui/Logo';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';
import { useAuth } from '@/services/auth/useAuth';
import { visibleGroups } from './navigation';

interface SidebarContentProps {
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}

/** Navigation commune à la sidebar desktop et au tiroir mobile. */
export function SidebarContent({ collapsed = false, onToggle, onNavigate }: SidebarContentProps) {
  const { t } = useTranslation();
  const { permissions } = useAuth();
  const groups = visibleGroups(permissions);

  return (
    <>
      <div className={cn('flex h-16 items-center gap-2 px-3', collapsed ? 'justify-center' : 'justify-between')}>
        <Logo tone="dark" compact={collapsed} />
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label={t(collapsed ? 'nav.expand' : 'nav.collapse')}
            aria-pressed={collapsed}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-control text-white/60 hover:bg-white/10 hover:text-white"
          >
            <ChevronsLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <nav aria-label={t('nav.mainNavigation')} className="flex-1 space-y-5 overflow-y-auto px-2.5 pb-4 sidebar-scroll">
        {groups.map((group) => (
          <div key={group.key}>
            <p
              className={cn(
                'px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45',
                collapsed && 'sr-only',
              )}
            >
              {t(group.labelKey)}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const label = t(item.labelKey);
                const link = (
                  <NavLink
                    to={item.path}
                    onClick={onNavigate}
                    aria-label={collapsed ? label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'relative flex h-9 items-center gap-2.5 rounded-control px-2.5 text-sm transition-colors',
                        isActive
                          ? 'bg-white/12 font-medium text-white'
                          : 'text-white/70 hover:bg-white/5 hover:text-white',
                        collapsed && 'justify-center px-0',
                      )
                    }
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                    <span className={cn('truncate', collapsed && 'sr-only')}>{label}</span>
                  </NavLink>
                );

                return (
                  <li key={item.key}>
                    {collapsed ? (
                      <Tooltip label={label} className="w-full">
                        {link}
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn('border-t border-white/10 px-3 py-3 text-[10px] text-white/40', collapsed && 'sr-only')}>
        {t('app.title')}
      </div>
    </>
  );
}
