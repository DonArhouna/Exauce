import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Inbox, Mail, Phone, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Select,
  Skeleton,
  StatusPill,
  Table,
  TableContainer,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Textarea,
  type BadgeTone,
} from '@/components/ui';
import { useToast } from '@/components/ui/useToast';
import { formatDateTime } from '@/lib/format';
import {
  addLeadNote,
  downloadCsv,
  exportLeads,
  getLead,
  listLeads,
  updateLeadStatus,
} from '@/services/api/endpoints/leads';
import type { AdminLeadDetail, LeadListQuery, LeadStatus } from '@/services/api/types';
import { ApiError } from '@/services/api/problem';
import { hasAnyPermission } from '@/services/auth/permissions';
import { useAuth } from '@/services/auth/useAuth';

const STATUS_TONE: Record<LeadStatus, BadgeTone> = {
  new: 'info',
  in_progress: 'warning',
  waiting: 'neutral',
  done: 'success',
  rejected: 'danger',
  anonymized: 'neutral',
};

const STATUSES: LeadStatus[] = ['new', 'in_progress', 'waiting', 'done', 'rejected', 'anonymized'];

const EMPTY_FILTERS = { status: 'all' as LeadStatus | 'all', search: '', from: '', to: '' };

/** Demandes de contact (`/demandes`) : liste filtrée et détail côte à côte. */
export default function LeadsPage() {
  const { t, i18n } = useTranslation();
  const { permissions } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const canChangeStatus = hasAnyPermission(permissions, 'leads', 'status');
  const canNote = hasAnyPermission(permissions, 'leads', 'notes');
  const canExport = hasAnyPermission(permissions, 'leads', 'export');

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);

  const query: LeadListQuery = {
    status: filters.status,
    search: filters.search || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
    limit: 20,
    offset: 0,
  };

  const list = useQuery({ queryKey: ['leads', query], queryFn: () => listLeads(query) });
  const detail = useQuery({
    queryKey: ['lead', selectedId],
    queryFn: () => getLead(selectedId as string),
    enabled: selectedId !== null,
  });

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: LeadStatus; revision: number }) =>
      updateLeadStatus(input.id, { status: input.status, revision: input.revision }),
    onSuccess: (updated) => {
      setConflict(false);
      queryClient.setQueryData(['lead', updated.id], updated);
      void queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.push({ tone: 'success', title: t('leads.detail.statusSaved') });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.problem.status === 409) {
        setConflict(true);
        void detail.refetch();
        return;
      }
      toast.push({ tone: 'error', title: t('leads.detail.statusError') });
    },
  });

  const noteMutation = useMutation({
    mutationFn: (input: { id: string; body: string }) => addLeadNote(input.id, input.body),
    onSuccess: (updated) => {
      setNote('');
      setNoteError(null);
      queryClient.setQueryData(['lead', updated.id], updated);
      toast.push({ tone: 'success', title: t('leads.detail.noteSaved') });
    },
    onError: () => setNoteError(t('leads.detail.noteError')),
  });

  const exportMutation = useMutation({
    mutationFn: () => exportLeads(query),
    onSuccess: (csv) => downloadCsv(`demandes-${new Date().toISOString().slice(0, 10)}.csv`, csv),
    onError: () => toast.push({ tone: 'error', title: t('leads.list.exportError') }),
  });

  const items = list.data?.items ?? [];
  const counts = list.data?.counts;
  const current = detail.data;

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setFilters((previous) => ({ ...previous, search: searchInput.trim() }));
  }

  function reset() {
    setFilters(EMPTY_FILTERS);
    setSearchInput('');
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink">{t('leads.list.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('leads.list.subtitle')}</p>
        </div>
        {canExport ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {exportMutation.isPending ? t('leads.list.exporting') : t('leads.list.export')}
          </Button>
        ) : null}
      </header>

      <section aria-label={t('leads.list.filters')} className="space-y-3 rounded-card border border-line bg-surface p-4">
        <form onSubmit={submitSearch} className="flex flex-wrap items-end gap-3">
          <Field id="lead-search" label={t('leads.list.search')} className="min-w-56 flex-1">
            <Input
              id="lead-search"
              type="search"
              value={searchInput}
              placeholder={t('leads.list.searchPlaceholder')}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </Field>
          <Field id="lead-from" label={t('leads.list.from')}>
            <Input
              id="lead-from"
              type="date"
              value={filters.from}
              onChange={(event) => setFilters((previous) => ({ ...previous, from: event.target.value }))}
            />
          </Field>
          <Field id="lead-to" label={t('leads.list.to')}>
            <Input
              id="lead-to"
              type="date"
              value={filters.to}
              onChange={(event) => setFilters((previous) => ({ ...previous, to: event.target.value }))}
            />
          </Field>
          <Button type="submit" size="sm">
            {t('leads.list.apply')}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            {t('leads.list.reset')}
          </Button>
        </form>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('leads.list.statusFilter')}>
          <FilterChip
            active={filters.status === 'all'}
            label={t('leads.list.statusAll')}
            count={counts ? Object.values(counts).reduce((sum, value) => sum + value, 0) : undefined}
            onClick={() => setFilters((previous) => ({ ...previous, status: 'all' }))}
          />
          {STATUSES.map((status) => (
            <FilterChip
              key={status}
              active={filters.status === status}
              label={t(`leads.status.${status}`)}
              count={counts?.[status]}
              onClick={() => setFilters((previous) => ({ ...previous, status }))}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section aria-label={t('leads.list.results')} className="space-y-3">
          {list.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : list.isError ? (
            <div className="space-y-2">
              <Alert tone="danger" title={t('leads.list.loadError')} />
              <Button variant="secondary" size="sm" onClick={() => void list.refetch()}>
                {t('common.retry')}
              </Button>
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={Inbox} title={t('leads.list.empty')} description={t('leads.list.emptyHint')} />
          ) : (
            <>
              <p className="text-xs text-muted">{t('leads.list.count', { count: list.data?.total ?? items.length })}</p>
              <TableContainer className="rounded-card border border-line bg-surface">
                <Table>
                  <THead>
                    <TR>
                      <TH>{t('leads.list.columns.reference')}</TH>
                      <TH>{t('leads.list.columns.contact')}</TH>
                      <TH>{t('leads.list.columns.subject')}</TH>
                      <TH>{t('leads.list.columns.status')}</TH>
                      <TH>
                        <span className="sr-only">{t('leads.list.columns.actions')}</span>
                      </TH>
                    </TR>
                  </THead>
                  <TBody>
                    {items.map((lead) => (
                      <TR key={lead.id} aria-current={lead.id === selectedId ? 'true' : undefined}>
                        <TD>
                          <span className="font-mono text-xs text-muted">{lead.reference}</span>
                          <p className="text-xs text-muted">{formatDateTime(lead.created_at, i18n.language)}</p>
                        </TD>
                        <TD>
                          <span className="font-medium text-ink">{lead.full_name}</span>
                          <p className="text-xs text-muted">{lead.company ?? lead.email}</p>
                        </TD>
                        <TD>
                          {lead.subject}
                          {lead.sector ? <p className="text-xs text-muted">{lead.sector}</p> : null}
                        </TD>
                        <TD>
                          <StatusPill tone={STATUS_TONE[lead.status]}>{t(`leads.status.${lead.status}`)}</StatusPill>
                        </TD>
                        <TD className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedId(lead.id)}>
                            {t('leads.list.open')}
                          </Button>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </TableContainer>
            </>
          )}
        </section>

        <section aria-label={t('leads.detail.title')} className="space-y-3">
          {selectedId === null ? (
            <div className="rounded-card border border-dashed border-line bg-surface/60 p-6 text-sm text-muted">
              {t('leads.detail.choose')}
            </div>
          ) : detail.isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : detail.isError || !current ? (
            <div className="space-y-2">
              <Alert tone="danger" title={t('leads.detail.loadError')} />
              <Button variant="secondary" size="sm" onClick={() => void detail.refetch()}>
                {t('common.retry')}
              </Button>
            </div>
          ) : (
            <LeadDetailPanel
              lead={current}
              canChangeStatus={canChangeStatus}
              canNote={canNote}
              conflict={conflict}
              note={note}
              noteError={noteError}
              notePending={noteMutation.isPending}
              statusPending={statusMutation.isPending}
              onClose={() => setSelectedId(null)}
              onNoteChange={setNote}
              onNoteSubmit={() => {
                const body = note.trim();
                if (!body) {
                  setNoteError(t('leads.detail.noteRequired'));
                  return;
                }
                noteMutation.mutate({ id: current.id, body });
              }}
              onStatusChange={(status) =>
                statusMutation.mutate({ id: current.id, status, revision: current.revision })
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={
        active
          ? 'inline-flex items-center gap-1.5 rounded-full bg-turquoise-800 px-3 py-1 text-xs font-medium text-white'
          : 'inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-slate-600 hover:border-turquoise-300'
      }
    >
      {label}
      {typeof count === 'number' ? <span className="opacity-70">{count}</span> : null}
    </button>
  );
}

interface DetailProps {
  lead: AdminLeadDetail;
  canChangeStatus: boolean;
  canNote: boolean;
  conflict: boolean;
  note: string;
  noteError: string | null;
  notePending: boolean;
  statusPending: boolean;
  onClose: () => void;
  onNoteChange: (value: string) => void;
  onNoteSubmit: () => void;
  onStatusChange: (status: LeadStatus) => void;
}

function LeadDetailPanel({
  lead,
  canChangeStatus,
  canNote,
  conflict,
  note,
  noteError,
  notePending,
  statusPending,
  onClose,
  onNoteChange,
  onNoteSubmit,
  onStatusChange,
}: DetailProps) {
  const { t, i18n } = useTranslation();
  const anonymized = lead.status === 'anonymized';

  return (
    <div className="space-y-4 rounded-card border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-muted">{lead.reference}</p>
          <h2 className="font-display text-lg text-ink">{lead.full_name}</h2>
          <p className="text-sm text-muted">{lead.subject}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label={t('leads.detail.close')}>
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={STATUS_TONE[lead.status]}>{t(`leads.status.${lead.status}`)}</StatusPill>
        {lead.assigned_to_name ? <Badge tone="neutral">{lead.assigned_to_name}</Badge> : null}
      </div>

      {anonymized ? <Alert tone="info" title={t('leads.detail.anonymized')} /> : null}
      {conflict ? <Alert tone="warning" title={t('leads.detail.conflict')} /> : null}

      <dl className="grid grid-cols-1 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted" aria-hidden="true" />
          <a className="text-turquoise-700 underline underline-offset-4" href={`mailto:${lead.email}`}>
            {lead.email}
          </a>
        </div>
        {lead.phone ? (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted" aria-hidden="true" />
            <a className="text-turquoise-700 underline underline-offset-4" href={`tel:${lead.phone}`}>
              {lead.phone}
            </a>
          </div>
        ) : null}
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">{t('leads.detail.company')}</dt>
          <dd>{lead.company ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">{t('leads.detail.sector')}</dt>
          <dd>{lead.sector ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">{t('leads.detail.source')}</dt>
          <dd>{lead.source}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">{t('leads.detail.receivedAt')}</dt>
          <dd>{formatDateTime(lead.created_at, i18n.language)}</dd>
        </div>
      </dl>

      <div>
        <h3 className="text-xs uppercase tracking-wide text-muted">{t('leads.detail.message')}</h3>
        <p className="mt-1 whitespace-pre-line text-sm text-ink">{lead.message}</p>
      </div>

      {canChangeStatus ? (
        <Field id="lead-status" label={t('leads.detail.status')} hint={t('leads.detail.statusHint')}>
          <Select
            id="lead-status"
            value={lead.status}
            disabled={anonymized || statusPending}
            onChange={(event) => onStatusChange(event.target.value as LeadStatus)}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`leads.status.${status}`)}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <div className="space-y-2 border-t border-line pt-3">
        <h3 className="text-sm font-medium text-ink">{t('leads.detail.notes')}</h3>
        {lead.notes.length === 0 ? (
          <p className="text-xs text-muted">{t('leads.detail.notesEmpty')}</p>
        ) : (
          <ul className="space-y-2">
            {lead.notes.map((entry) => (
              <li key={entry.id} className="rounded-control bg-ivory/70 p-2 text-sm">
                <p className="text-ink">{entry.body}</p>
                <p className="mt-1 text-xs text-muted">
                  {entry.author_name} · {formatDateTime(entry.created_at, i18n.language)}
                </p>
              </li>
            ))}
          </ul>
        )}

        {canNote && !anonymized ? (
          <div className="space-y-2">
            <Field id="lead-note" label={t('leads.detail.addNote')} error={noteError ?? undefined}>
              <Textarea
                id="lead-note"
                value={note}
                invalid={Boolean(noteError)}
                placeholder={t('leads.detail.notePlaceholder')}
                onChange={(event) => onNoteChange(event.target.value)}
              />
            </Field>
            <Button size="sm" onClick={onNoteSubmit} disabled={notePending}>
              {notePending ? t('leads.detail.noteSaving') : t('leads.detail.noteSubmit')}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
