import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isLang } from '@/i18n';
import { useEditionLanguage } from '@/services/edition/useEditionLanguage';

/** Langue du contenu édité, indépendante de la langue de l'interface. */
export function EditionLanguageSelect() {
  const { t } = useTranslation();
  const { lang, setLang } = useEditionLanguage();

  return (
    <label
      title={t('language.edition')}
      className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line bg-surface px-2 text-xs text-muted"
    >
      <Languages className="h-3.5 w-3.5 text-turquoise-700" aria-hidden="true" />
      <span className="sr-only">{t('language.edition')}</span>
      <select
        value={lang}
        onChange={(event) => {
          if (isLang(event.target.value)) setLang(event.target.value);
        }}
        aria-label={t('language.edition')}
        className="h-full cursor-pointer bg-transparent pr-1 text-xs font-medium uppercase text-ink focus:outline-none"
      >
        <option value="fr">FR</option>
        <option value="en">EN</option>
      </select>
    </label>
  );
}
