import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { ToastContext, type ToastInput, type ToastTone } from './toast-context';

interface ToastItem extends ToastInput {
  id: number;
  tone: ToastTone;
}

const icons = {
  info: Info,
  success: CheckCircle2,
  error: XCircle,
};

const tones: Record<ToastTone, string> = {
  info: 'border-line text-ink',
  success: 'border-status-success/30 text-ink',
  error: 'border-status-danger/30 text-ink',
};

const iconTones: Record<ToastTone, string> = {
  info: 'text-status-info',
  success: 'text-status-success',
  error: 'text-status-danger',
};

/** Fournit `useToast` et rend la pile de notifications. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((input: ToastInput) => {
    setToasts((current) => [...current, { ...input, id: Date.now() + Math.random(), tone: input.tone ?? 'info' }]);
  }, []);

  const api = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} closeLabel={t('common.close')} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss, closeLabel }: { toast: ToastItem; onDismiss: () => void; closeLabel: string }) {
  const Icon = icons[toast.tone];

  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        'pointer-events-auto flex animate-slide-up items-start gap-3 rounded-card border bg-surface p-3 shadow-pop',
        tones[toast.tone],
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconTones[toast.tone])} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{toast.title}</p>
        {toast.description ? <p className="mt-0.5 text-xs text-muted">{toast.description}</p> : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={closeLabel}
        className="grid h-6 w-6 place-items-center rounded text-slate-400 hover:bg-ink/5 hover:text-ink"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
