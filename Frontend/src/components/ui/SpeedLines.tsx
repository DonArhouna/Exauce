import { cn } from '@/lib/utils';

/**
 * Motif signature « traits de vitesse » du logo — SVG décoratif.
 * Trois traits turquoise inclinés suggérant vitesse et précision.
 */
export function SpeedLines({
  className,
  tone = 'turquoise',
}: {
  className?: string;
  tone?: 'turquoise' | 'pale' | 'white';
}) {
  const fill =
    tone === 'turquoise' ? 'currentColor text-turquoise-500' : tone === 'pale' ? 'text-turquoise-pale' : 'text-white';
  return (
    <svg
      viewBox="0 0 120 34"
      fill="none"
      aria-hidden="true"
      className={cn('h-5 w-auto', fill, className)}
    >
      <path d="M14 8h96a4 4 0 0 1 0 8H14z" fill="#4EB9AE" opacity="0.95" />
      <path d="M4 18h110a4 4 0 0 1 0 8H4z" fill="#4EB9AE" opacity="0.8" />
      <path d="M24 28h92a3.5 3.5 0 0 1 0 7H24z" fill="#A1DAD4" opacity="0.55" />
    </svg>
  );
}
