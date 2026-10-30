import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Lang } from '@/types/content';
import { cn } from '@/lib/utils';

import { translatePath } from '@/lib/routes';

const LANGS: { code: Lang; label: string }[] = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
];

/**
 * Sélecteur de langue : remplace le segment de langue dans l’URL courante
 * (les slugs traduits sont résolus par le routeur).
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const current = (lang === 'en' ? 'en' : 'fr') as Lang;

  const switchTo = (target: Lang) => {
    if (target === current) return;
    navigate(`${translatePath(location.pathname, target)}${location.search}`);
  };

  return (
    <div
      className={cn('flex items-center gap-1 text-xs font-semibold', className)}
      role="group"
      aria-label={t('nav.language')}
    >
      <Languages aria-hidden="true" className="mr-1 h-4 w-4 opacity-70" />
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => switchTo(l.code)}
          aria-current={l.code === current || undefined}
          className={cn(
            'rounded-full px-2 py-1 transition-colors',
            l.code === current
              ? 'bg-turquoise-500 text-ink'
              : 'text-current/70 hover:text-turquoise-700',
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
