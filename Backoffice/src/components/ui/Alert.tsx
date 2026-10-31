import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const tones: Record<AlertTone, { wrapper: string; icon: string }> = {
  info: { wrapper: 'border-turquoise-200 bg-turquoise-50 text-turquoise-900', icon: 'text-turquoise-700' },
  success: { wrapper: 'border-status-success/25 bg-status-success-soft text-status-success', icon: 'text-status-success' },
  warning: { wrapper: 'border-status-warning/25 bg-status-warning-soft text-status-warning', icon: 'text-status-warning' },
  danger: { wrapper: 'border-status-danger/25 bg-status-danger-soft text-status-danger', icon: 'text-status-danger' },
};

const icons = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: XCircle };

interface AlertProps {
  tone?: AlertTone;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

/** Bandeau d'information ou d'erreur annoncé aux technologies d'assistance. */
export function Alert({ tone = 'info', title, description, children, className }: AlertProps) {
  const Icon = icons[tone];
  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2.5 rounded-panel border px-3.5 py-3 text-sm', tones[tone].wrapper, className)}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tones[tone].icon)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        {description ? <p className="mt-0.5 text-xs opacity-90">{description}</p> : null}
        {children}
      </div>
    </div>
  );
}
