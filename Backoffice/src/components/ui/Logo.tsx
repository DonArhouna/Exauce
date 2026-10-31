import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface LogoProps {
  tone?: 'light' | 'dark';
  compact?: boolean;
  className?: string;
}

/** Signature EXAUCE : monogramme + traits de vitesse, nom et métier. */
export function Logo({ tone = 'light', compact = false, className }: LogoProps) {
  const { t } = useTranslation();
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-control',
          tone === 'light' ? 'bg-abyss-gradient' : 'bg-white/10',
        )}
        aria-hidden="true"
      >
        <span className="speed-lines h-3 w-5 rounded-[1px]" />
      </span>
      {compact ? null : (
        <span className="min-w-0 leading-tight">
          <span
            className={cn(
              'block font-display text-[17px] tracking-tight',
              tone === 'light' ? 'text-ink' : 'text-white',
            )}
          >
            {t('app.name')}
          </span>
          <span
            className={cn(
              'block text-[10px] uppercase tracking-[0.16em]',
              tone === 'light' ? 'text-muted' : 'text-white/60',
            )}
          >
            {t('app.tagline')}
          </span>
        </span>
      )}
    </span>
  );
}
