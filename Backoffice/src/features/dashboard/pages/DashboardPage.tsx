import { useQuery } from '@tanstack/react-query';
import { Inbox, Newspaper, PenLine, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDateTime } from '@/lib/format';
import { getDashboard } from '@/services/api/endpoints/dashboard';
import { useAuth } from '@/services/auth/useAuth';
import { hasAnyPermission } from '@/services/auth/permissions';
import { ActivityList } from '../components/ActivityList';
import { I18nCompleteness } from '../components/I18nCompleteness';
import { LeadList } from '../components/LeadList';
import { ShortcutsCard } from '../components/ShortcutsCard';
import { StatCard } from '../components/StatCard';

/** Page d'accueil : synthèse leads, publications, contenus, build et activité. */
export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { permissions } = useAuth();
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  });

  const retry = () => {
    void refetch();
  };

  // Le tableau de bord est ouvert à tout utilisateur authentifié ; chaque bloc
  // n'apparaît que si la permission correspondante est détenue. Le serveur
  // reste l'autorité et filtre de toute façon les données renvoyées.
  const canOpenLeads = hasAnyPermission(permissions, 'leads', 'view');
  const canViewPublications = hasAnyPermission(permissions, 'publications', 'view');
  const canViewContent = hasAnyPermission(permissions, 'pages', 'view');
  const canViewI18n = hasAnyPermission(permissions, 'settings', 'view');
  const canOpenAudit = hasAnyPermission(permissions, 'audit', 'view');
  const siteStatus = data?.publication?.site_status ?? 'pending_changes';
  const statusLabels: Record<string, string> = {
    up_to_date: t('publication.upToDate'),
    pending_changes: t('publication.pendingChanges'),
    building: t('publication.building'),
    failed: t('publication.failed'),
  };
  const lastSuccess = data?.publication?.last_success_at
    ? formatDateTime(data.publication.last_success_at, i18n.language)
    : t('publication.never');

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink">{t('dashboard.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('dashboard.subtitle')}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={retry} isLoading={isFetching}>
          {t('dashboard.refresh')}
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {canOpenLeads ? (
          <StatCard
            icon={Inbox}
            label={t('dashboard.leads.title')}
            value={data?.leads?.new_count ?? 0}
            hint={t('dashboard.leads.pending')}
            tone="warning"
            loading={isLoading}
            error={isError}
            onRetry={retry}
          />
        ) : null}
        {canViewPublications ? (
          <StatCard
            icon={Newspaper}
            label={t('dashboard.publications.title')}
            value={data?.publications?.draft_count ?? 0}
            hint={t('dashboard.publications.inReviewCount', { count: data?.publications?.in_review_count ?? 0 })}
            tone="info"
            loading={isLoading}
            error={isError}
            onRetry={retry}
          />
        ) : null}
        {canViewContent ? (
          <StatCard
            icon={PenLine}
            label={t('dashboard.content.title')}
            value={data?.content?.unpublished_changes_count ?? 0}
            hint={t('dashboard.content.hint')}
            tone="warning"
            loading={isLoading}
            error={isError}
            onRetry={retry}
          />
        ) : null}
        {canViewPublications ? (
          <StatCard
            icon={Rocket}
            label={t('dashboard.build.title')}
            value={statusLabels[siteStatus]}
            hint={lastSuccess}
            tone={siteStatus === 'failed' ? 'danger' : siteStatus === 'building' ? 'info' : 'success'}
            compact
            loading={isLoading}
            error={isError}
            onRetry={retry}
          />
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {canOpenLeads ? (
          <Card className="xl:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>{t('dashboard.leads.recent')}</CardTitle>
                <CardDescription>
                  {t('dashboard.leads.newCount', { count: data?.leads?.new_count ?? 0 })}
                </CardDescription>
              </div>
              <span className="grid h-8 w-8 place-items-center rounded-control bg-turquoise-50 text-turquoise-700">
                <Inbox className="h-4 w-4" aria-hidden="true" />
              </span>
            </CardHeader>
            <CardContent>
              <LeadList leads={data?.leads?.recent} loading={isLoading} error={isError} onRetry={retry} />
            </CardContent>
            <CardFooter>
              <Link to="/demandes" className="text-sm font-medium text-turquoise-700 hover:text-turquoise-600">
                {t('dashboard.leads.viewAll')}
              </Link>
            </CardFooter>
          </Card>
        ) : null}

        <div className={`space-y-4 ${canOpenLeads ? '' : 'xl:col-span-3'}`}>
          {canOpenAudit ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.activity.title')}</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <ActivityList entries={data?.audit?.recent} loading={isLoading} error={isError} onRetry={retry} />
              </CardContent>
              <CardFooter>
                <Link to="/audit" className="text-sm font-medium text-turquoise-700 hover:text-turquoise-600">
                  {t('dashboard.activity.viewAll')}
                </Link>
              </CardFooter>
            </Card>
          ) : null}

          {canViewI18n ? (
            <I18nCompleteness
              completeness={data?.i18n?.completeness_pct}
              missing={data?.i18n?.missing_count}
              loading={isLoading}
              error={isError}
              onRetry={retry}
            />
          ) : null}

          <ShortcutsCard />
        </div>
      </div>
    </div>
  );
}
