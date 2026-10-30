import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface Props extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'article' | 'section';
  tone?: 'light' | 'dark' | 'turquoise';
}

/** Conteneur centré avec gouttières responsive. */
export function Container({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mx-auto w-full max-w-6xl px-5 sm:px-8', className)} {...props}>
      {children}
    </div>
  );
}

/** Section avec padding vertical du design system. */
export function Section({
  tone = 'light',
  className,
  children,
  ...props
}: Props) {
  return (
    <section
      className={cn(
        'py-section-sm md:py-section',
        tone === 'light' && 'bg-ivory text-ink',
        tone === 'dark' && 'bg-abyss-gradient text-ivory',
        tone === 'turquoise' && 'bg-turquoise-500/10 text-ink',
        className,
      )}
      {...props}
    >
      <Container>{children}</Container>
    </section>
  );
}

/** Titre de section serif avec filet signature. */
export function SectionHeading({
  kicker,
  title,
  tone = 'light',
  className,
  id,
}: {
  kicker?: string;
  title: string;
  tone?: 'light' | 'dark';
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn('max-w-2xl', className)}>
      {kicker && (
        <p
          className={cn(
            'mb-3 text-xs font-semibold uppercase tracking-[0.25em]',
            tone === 'dark' ? 'text-turquoise-400' : 'text-turquoise-700',
          )}
        >
          {kicker}
        </p>
      )}
      <div className="relative inline-block">
        <h2
          id={id}
          className={cn(
            'font-display text-display-lg',
            tone === 'dark' ? 'text-ivory' : 'text-ink',
          )}
        >
          {title}
        </h2>
        <span
          aria-hidden="true"
          className="absolute -bottom-3 left-0 h-[3px] w-20 rounded-full bg-gradient-to-r from-turquoise-500 to-turquoise-500/0"
        />
      </div>
    </div>
  );
}
