import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { BlockError } from './BlockState';

interface I18nCompletenessProps {
  completeness?: number;
  missing?: number;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

/** Complétude FR/EN des contenus éditoriaux. */
export function I18nCompleteness({ completeness, missing, loading, error, onRetry }: I18nCompletenessProps) {
  const { t } = useTranslation();
  const percent = Math.max(0, Math.min(100, completeness ?? 0));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.i18n.title')}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-2 w-full" />
          </div>
        ) : error ? (
          <BlockError onRetry={onRetry} />
        ) : (
          <>
            <p className="font-display text-2xl text-ink">
              {t('dashboard.i18n.value', { value: percent.toFixed(0) })}
            </p>
            <div
              role="progressbar"
              aria-label={t('dashboard.i18n.title')}
              aria-valuenow={Math.round(percent)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-2 h-2 overflow-hidden rounded-full bg-line"
            >
              <div className="h-full rounded-full bg-turquoise-500" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted">
              {t('dashboard.i18n.missing', { count: missing ?? 0 })}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
