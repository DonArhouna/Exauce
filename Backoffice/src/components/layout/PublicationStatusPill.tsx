import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill, type BadgeTone } from '@/components/ui/Badge';
import { usePublicationStatus } from '@/hooks/usePublicationStatus';
import type { PublicationSiteStatus } from '@/services/api/types';

const TONES: Record<PublicationSiteStatus['site_status'], BadgeTone> = {
  up_to_date: 'success',
  pending_changes: 'warning',
  building: 'info',
  failed: 'danger',
};

const LABELS: Record<PublicationSiteStatus['site_status'], string> = {
  up_to_date: 'publication.upToDate',
  pending_changes: 'publication.pendingChanges',
  building: 'publication.building',
  failed: 'publication.failed',
};

/** Indicateur compact : à jour, en attente, build en cours, échec. */
export function PublicationStatusPill() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = usePublicationStatus();

  if (isLoading) return <Skeleton className="h-6 w-28 rounded-full" />;
  if (isError || !data) {
    return (
      <StatusPill tone="neutral" title={t('publication.label')}>
        —
      </StatusPill>
    );
  }

  return (
    <StatusPill tone={TONES[data.site_status]} title={t('publication.label')}>
      {t(LABELS[data.site_status])}
    </StatusPill>
  );
}
