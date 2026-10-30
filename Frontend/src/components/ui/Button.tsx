import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'ghost' | 'onDark' | 'link';
type Size = 'md' | 'lg';

const base =
  'inline-flex items-center gap-2 rounded-full font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-turquoise-500 focus-visible:ring-offset-2';

const variants: Record<Variant, string> = {
  primary:
    'bg-turquoise-500 text-ink hover:bg-turquoise-600 hover:text-white shadow-card hover:shadow-cardHover px-6',
  ghost:
    'border border-ink/15 text-ink hover:border-turquoise-500 hover:text-turquoise-700 bg-white/50 px-6',
  onDark:
    'border border-white/25 text-white hover:border-turquoise-400 hover:text-turquoise-400 bg-white/5 backdrop-blur px-6',
  link: 'text-turquoise-700 hover:text-turquoise-600 underline underline-offset-4 decoration-turquoise-300',
};

const sizes: Record<Size, string> = {
  md: 'h-11 text-sm',
  lg: 'h-13 text-base px-8',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, CommonProps {
  href?: never;
}

interface AnchorButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement>, CommonProps {
  href: string;
}

/** Bouton réutilisable (primary / ghost / onDark / link). */
export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps | AnchorButtonProps
>(({ variant = 'primary', size = 'md', className, ...props }, ref) => {
  const classes = cn(base, variants[variant], variant !== 'link' && sizes[size], className);
  if (props.href !== undefined) {
    const { href, ...rest } = props as AnchorButtonProps;
    return (
      <Link to={href} className={classes} ref={ref as never} {...rest} />
    );
  }
  const { type, ...rest } = props as ButtonProps;
  return (
    <button type={type ?? 'button'} className={classes} ref={ref as never} {...rest} />
  );
});

Button.displayName = 'Button';
