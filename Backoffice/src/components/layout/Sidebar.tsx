import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { SidebarContent } from './SidebarContent';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/** Sidebar contrastée, détachée des bords, repliable en mode icônes. */
export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t } = useTranslation();
  return (
    <aside
      aria-label={t('nav.mainNavigation')}
      data-collapsed={collapsed}
      className={cn(
        'fixed inset-y-3 left-3 z-40 hidden flex-col rounded-card border border-white/5 bg-sidebar-gradient shadow-pop transition-[width] duration-200 lg:flex',
        collapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
      )}
    >
      <SidebarContent collapsed={collapsed} onToggle={onToggle} />
    </aside>
  );
}
