import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { BlockError } from './BlockState';

type Tone = 'info' | 'success' | 'warning' | 'danger';

const tones: Record<Tone, string> = {
  info: 'bg-turquoise-50 text-turquoise-700',
  success: 'bg-status-success-soft text-status-success',
  warning: 'bg-status-warning-soft text-status-warning',
  danger: 'bg-status-danger-soft text-status-danger',
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
  compact?: boolean;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

/** Carte de chiffre clé : chargement, erreur et valeur. */
export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'info',
  compact = false,
  loading = false,
  error = false,
  onRetry,
}: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-control', tones[tone])}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      {loading ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-28" />
        </div>
      ) : error ? (
        <div className="mt-3">
          <p className="font-display text-2xl text-muted" aria-hidden="true">
            —
          </p>
          <BlockError onRetry={onRetry} compact />
        </div>
      ) : (
        <div className="mt-2">
          <p className={cn('font-display text-ink', compact ? 'text-lg leading-snug' : 'text-3xl')}>{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
        </div>
      )}
    </Card>
  );
}
