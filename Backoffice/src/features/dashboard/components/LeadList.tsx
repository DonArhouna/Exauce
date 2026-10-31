import { Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonText } from '@/components/ui/Skeleton';
import { Table, TBody, TD, TH, THead, TableContainer, TR } from '@/components/ui/Table';
import { formatDateTime } from '@/lib/format';
import type { LeadSummary } from '@/services/api/types';
import { useAuth } from '@/services/auth/useAuth';
import { hasAnyPermission } from '@/services/auth/permissions';
import { BlockError } from './BlockState';

const STATUS_TONES: Record<string, BadgeTone> = {
  new: 'warning',
  in_progress: 'info',
  waiting: 'neutral',
  done: 'success',
  rejected: 'danger',
  anonymized: 'neutral',
};

interface LeadListProps {
  leads?: LeadSummary[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

/** Dernières demandes ; le contrat v1 n'expose pas de fiche lead dédiée. */
export function LeadList({ leads, loading, error, onRetry }: LeadListProps) {
  const { t, i18n } = useTranslation();
  const { permissions } = useAuth();
  const canOpen = hasAnyPermission(permissions, 'leads', 'view');

  if (loading) return <SkeletonText lines={4} />;
  if (error) return <BlockError onRetry={onRetry} />;
  if (!leads || leads.length === 0) {
    return <EmptyState icon={Inbox} title={t('dashboard.leads.empty')} compact />;
  }

  return (
    <TableContainer>
      <Table>
        <THead>
          <TR>
            <TH>{t('dashboard.leads.name')}</TH>
            <TH>{t('dashboard.leads.subject')}</TH>
            <TH>{t('dashboard.leads.status')}</TH>
            <TH>{t('dashboard.leads.date')}</TH>
          </TR>
        </THead>
        <TBody>
          {leads.map((lead) => {
            const status = lead.status ?? 'new';
            const subject = lead.subject ?? '—';
            return (
              <TR key={lead.id}>
                <TD className="font-medium">{lead.name ?? '—'}</TD>
                <TD>
                  {canOpen ? (
                    <Link to="/demandes" className="text-turquoise-700 underline-offset-2 hover:underline">
                      {subject}
                    </Link>
                  ) : (
                    subject
                  )}
                </TD>
                <TD>
                  <Badge tone={STATUS_TONES[status] ?? 'neutral'}>{t(`leads.status.${status}`)}</Badge>
                </TD>
                <TD className="whitespace-nowrap text-muted">{formatDateTime(lead.created_at, i18n.language)}</TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
    </TableContainer>
  );
}
