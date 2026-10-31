import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  label: string;
  children: ReactNode;
  side?: 'right' | 'bottom';
  className?: string;
}

/**
 * Infobulle légère. Le déclencheur doit rester accessible par lui-même
 * (`aria-label` sur un bouton-icône) : l'infobulle est un complément visuel.
 */
export function Tooltip({ label, children, side = 'right', className }: TooltipProps) {
  const id = useId();
  return (
    <span className={cn('group relative inline-flex', className)}>
      <span aria-describedby={id} className="inline-flex">
        {children}
      </span>
      <span
        role="tooltip"
        id={id}
        className={cn(
          'pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-pop transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100',
          side === 'right' && 'left-full top-1/2 ml-3 -translate-y-1/2',
          side === 'bottom' && 'left-1/2 top-full mt-2 -translate-x-1/2',
        )}
      >
        {label}
      </span>
    </span>
  );
}
