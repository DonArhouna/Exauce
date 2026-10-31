import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

/** Indicateur de chargement annoncé aux lecteurs d'écran. */
export function Spinner({ className, label }: { className?: string; label?: string }) {
  const { t } = useTranslation();
  const text = label ?? t('common.loading');
  return (
    <span className={cn('inline-flex items-center gap-2 text-sm text-muted', className)} role="status" aria-live="polite">
      <Loader2 className="h-4 w-4 animate-spin text-turquoise-600" aria-hidden="true" />
      <span>{text}</span>
    </span>
  );
}
