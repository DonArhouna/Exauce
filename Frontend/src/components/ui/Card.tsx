import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/** Carte premium épurée (bordure fine, ombre douce). */
export function Card({
  interactive = true,
  tone = 'light',
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  tone?: 'light' | 'dark';
}) {
  return (
    <div
      className={cn(
        'rounded-card border p-6 transition-all duration-300',
        tone === 'light' &&
          'border-ink/8 bg-white shadow-card',
        tone === 'dark' &&
          'border-white/10 bg-white/5 backdrop-blur-sm shadow-none',
        interactive &&
          cn(
            'hover:shadow-cardHover hover:-translate-y-0.5',
            tone === 'light' ? 'hover:border-turquoise-400/60' : 'hover:border-turquoise-500/50',
          ),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Badge discret (catégories, tags). */
export function Badge({
  tone = 'light',
  className,
  children,
}: {
  tone?: 'light' | 'dark';
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide',
        tone === 'light' ? 'bg-turquoise-500/12 text-turquoise-800' : 'bg-white/10 text-turquoise-300',
        className,
      )}
    >
      {children}
    </span>
  );
}
