import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Alert, Badge, Button, EmptyState, Skeleton, StatusPill, Table, TableContainer, TBody, TD, TH, THead, TR } from '@/components/ui';
import { PAGE_STATUS_LABEL, listPages } from '@/services/api/endpoints/pages';
import type { PageStatus } from '@/services/api/types';
import { useEditionLanguage } from '@/services/edition/useEditionLanguage';

const STATUS_TONE: Record<PageStatus, 'neutral' | 'info' | 'success' | 'warning'> = {
  draft: 'neutral',
  in_review: 'warning',
  approved: 'info',
  published: 'success',
  archived: 'neutral',
};

/** Liste des pages éditoriales (`/pages`). */
export default function PagesListPage() {
  const { t } = useTranslation();
  const { lang } = useEditionLanguage();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['pages'],
    queryFn: listPages,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3">
        <Alert tone="danger" title={t('pages.list.loadError')} />
        <Button variant="secondary" size="sm" onClick={() => void refetch()}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  const pages = data ?? [];

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-2xl text-ink">{t('pages.list.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('pages.list.subtitle')}</p>
      </header>

      {pages.length === 0 ? (
        <EmptyState icon={FileText} title={t('pages.list.empty')} description={t('pages.list.emptyHint')} />
      ) : (
        <TableContainer className="rounded-card border border-line bg-surface">
          <Table>
            <THead>
              <TR>
                <TH>{t('pages.list.columns.page')}</TH>
                <TH>{t('pages.list.columns.status')}</TH>
                <TH>{t('pages.list.columns.nav')}</TH>
                <TH>{t('pages.list.columns.sections')}</TH>
                <TH>
                  <span className="sr-only">{t('pages.list.columns.actions')}</span>
                </TH>
              </TR>
            </THead>
            <TBody>
              {pages.map((page) => (
                <TR key={page.id}>
                  <TD>
                    <Link
                      to={`/pages/${page.id}`}
                      className="font-medium text-turquoise-800 underline decoration-turquoise-300 underline-offset-4 hover:text-turquoise-600"
                    >
                      {page.title[lang] || page.page_key}
                    </Link>
                    <p className="text-xs text-muted">
                      {page.page_key} · {page.template}
                    </p>
                  </TD>
                  <TD>
                    <StatusPill tone={STATUS_TONE[page.status]}>
                      {t(PAGE_STATUS_LABEL[page.status])}
                    </StatusPill>
                  </TD>
                  <TD>
                    {page.is_in_nav ? (
                      <Badge tone="info">
                        {t('pages.list.navPosition', { position: page.nav_position ?? 0 })}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted">{t('pages.list.notInNav')}</span>
                    )}
                  </TD>
                  <TD>
                    {page.section_count === 0 ? (
                      <span className="text-xs text-muted">{t('pages.list.noSection')}</span>
                    ) : (
                      t('pages.list.sectionCount', { count: page.section_count })
                    )}
                  </TD>
                  <TD className="text-right">
                    <Link
                      to={`/pages/${page.id}`}
                      className="text-sm font-medium text-turquoise-700 underline underline-offset-4"
                    >
                      {t('pages.list.open')}
                    </Link>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
