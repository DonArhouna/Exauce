import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
type Size = 'sm' | 'md';

const base =
  'inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-turquoise-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55';

const variants: Record<Variant, string> = {
  primary: 'bg-turquoise-600 text-white hover:bg-turquoise-700 shadow-card',
  secondary: 'border border-line bg-surface text-ink hover:border-turquoise-400 hover:text-turquoise-800',
  ghost: 'text-slate-600 hover:bg-ink/5 hover:text-ink',
  danger: 'bg-status-danger text-white hover:bg-[#9C3932]',
  link: 'text-turquoise-700 underline underline-offset-4 decoration-turquoise-300 hover:text-turquoise-600',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

/** Bouton unique du back-office. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, className, children, disabled, type, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={cn(base, variants[variant], variant !== 'link' && sizes[size], className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  ),
);

Button.displayName = 'Button';
