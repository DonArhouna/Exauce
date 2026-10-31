import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';
import { listNotifications, markNotificationRead } from '@/services/api/endpoints/notifications';
import { hasAnyPermission } from '@/services/auth/permissions';
import { useAuth } from '@/services/auth/useAuth';

/** Cloche de notifications (nouveaux leads), masquée sans `leads:view`. */
export function NotificationMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { permissions } = useAuth();
  const allowed = hasAnyPermission(permissions, 'leads', 'view');

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => listNotifications({ limit: 10 }),
    enabled: allowed,
  });

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  if (!allowed) return null;

  const items = data?.items ?? [];

  return (
    <DropdownMenu
      label={t('nav.notifications')}
      trigger={<Bell className="h-4 w-4" aria-hidden="true" />}
      badge={data?.unread_count}
    >
      <DropdownMenuLabel>{t('notifications.title')}</DropdownMenuLabel>
      {items.length === 0 ? (
        <p className="px-3 py-4 text-xs text-muted">{t('notifications.empty')}</p>
      ) : (
        items.slice(0, 5).map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            icon={Inbox}
            onSelect={() => {
              if (!notification.read_at) markRead.mutate(notification.id);
              navigate('/demandes');
            }}
          >
            <span className={notification.read_at ? 'text-muted' : 'font-medium'}>
              {t('notifications.leadNew', { title: notification.title })}
            </span>
          </DropdownMenuItem>
        ))
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => navigate('/demandes')}>{t('notifications.viewLeads')}</DropdownMenuItem>
    </DropdownMenu>
  );
}
