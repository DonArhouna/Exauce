import { ScrollText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonText } from '@/components/ui/Skeleton';
import { formatDateTime } from '@/lib/format';
import type { AuditEntry } from '@/services/api/types';
import { BlockError } from './BlockState';

interface ActivityListProps {
  entries?: AuditEntry[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

/** Activité récente, lue dans le journal d'audit. */
export function ActivityList({ entries, loading, error, onRetry }: ActivityListProps) {
  const { t, i18n } = useTranslation();

  if (loading) return <SkeletonText lines={4} />;
  if (error) return <BlockError onRetry={onRetry} />;
  if (!entries || entries.length === 0) {
    return <EmptyState icon={ScrollText} title={t('dashboard.activity.empty')} compact />;
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry) => {
        const actor = entry.actor_type === 'system' ? t('audit.system') : entry.actor_name ?? t('audit.system');
        const action = t(`audit.actions.${entry.action}`, { defaultValue: entry.action });
        return (
          <li key={entry.id} className="flex items-start gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-turquoise-500" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm text-ink">
                <span className="font-medium">{actor}</span> {action}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {entry.entity_type} · {formatDateTime(entry.at, i18n.language)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
