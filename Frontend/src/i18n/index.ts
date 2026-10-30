import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import en from './locales/en.json';
import type { Lang } from '@/types/content';

export const SUPPORTED_LANGS: Lang[] = ['fr', 'en'];
export const DEFAULT_LANG: Lang = 'fr';

/** Detecte si un segment d’URL est une langue supportée. */
export function isLang(value: string | undefined): value is Lang {
  return value === 'fr' || value === 'en';
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: 'fr',
    supportedLngs: SUPPORTED_LANGS,
    nsSeparator: false,
    interpolation: { escapeValue: false },
  });

export default i18n;
