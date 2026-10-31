import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, MapPinOff } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { DASHBOARD_PATH } from '@/lib/navigation';

function PageState({
  icon,
  title,
  description,
}: {
  icon: typeof Lock;
  title: string;
  description: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-card border border-line bg-surface p-8 shadow-card">
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={
          <Link
            to={DASHBOARD_PATH}
            className="inline-flex h-9 items-center rounded-control bg-turquoise-600 px-3 text-sm font-medium text-white hover:bg-turquoise-700"
          >
            {t('errors.backToDashboard')}
          </Link>
        }
      />
    </div>
  );
}

/** 403 : permission absente côté UI (le serveur reste l'autorité). */
export function Forbidden() {
  const { t } = useTranslation();
  return <PageState icon={Lock} title={t('errors.forbiddenTitle')} description={t('errors.forbiddenText')} />;
}

/** 404 dans la coque applicative. */
export function NotFound() {
  const { t } = useTranslation();
  return <PageState icon={MapPinOff} title={t('errors.notFoundTitle')} description={t('errors.notFoundText')} />;
}
