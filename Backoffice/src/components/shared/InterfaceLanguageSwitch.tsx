import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGS, isLang } from '@/i18n';
import { cn } from '@/lib/utils';

/** Langue de l'interface (distincte de la langue d'édition du contenu). */
export function InterfaceLanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const current = isLang(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'fr';

  return (
    <div
      role="group"
      aria-label={t('language.interface')}
      className={cn('inline-flex items-center rounded-full border border-line bg-surface p-0.5', compact && 'text-xs')}
    >
      {SUPPORTED_LANGS.map((lang) => (
        <button
          key={lang}
          type="button"
          lang={lang}
          aria-pressed={current === lang}
          onClick={() => void i18n.changeLanguage(lang)}
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
            current === lang ? 'bg-abyss text-white' : 'text-slate-500 hover:text-ink',
          )}
        >
          {t(`language.${lang}`)}
        </button>
      ))}
    </div>
  );
}
