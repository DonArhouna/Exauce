import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import en from './locales/en.json';

export const SUPPORTED_LANGS = ['fr', 'en'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];
export const DEFAULT_LANG: Lang = 'fr';

/** Détecte si une valeur est une langue supportée. */
export function isLang(value: unknown): value is Lang {
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
    fallbackLng: DEFAULT_LANG,
    supportedLngs: [...SUPPORTED_LANGS],
    // La préférence d'interface n'est pas un secret : seul le stockage local est utilisé.
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'exauce.bo.lang',
    },
    interpolation: { escapeValue: false },
    nsSeparator: false,
    returnNull: false,
  });

export default i18n;
