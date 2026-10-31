import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

/** État vide explicite, avec action facultative. */
export function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center text-center', compact ? 'gap-1 py-6' : 'gap-2 py-12', className)}
    >
      <span className={cn('grid place-items-center rounded-full bg-turquoise-50 text-turquoise-700', compact ? 'h-8 w-8' : 'h-11 w-11')}>
        <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} aria-hidden="true" />
      </span>
      <p className={cn('font-medium text-ink', compact ? 'text-sm' : 'text-base')}>{title}</p>
      {description ? <p className="max-w-sm text-xs text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
