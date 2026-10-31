import { useTranslation } from 'react-i18next';

/** Erreur locale d'un bloc, avec relance. */
export function BlockError({ onRetry, compact = false }: { onRetry?: () => void; compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className={compact ? 'mt-1' : 'py-2'}>
      <p className="text-xs text-status-danger">{t('dashboard.blockError')}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 text-xs font-medium text-turquoise-700 underline underline-offset-2 hover:text-turquoise-600"
        >
          {t('common.retry')}
        </button>
      ) : null}
    </div>
  );
}
