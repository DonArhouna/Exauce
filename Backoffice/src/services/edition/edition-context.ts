import { createContext } from 'react';
import type { Lang } from '@/i18n';

export interface EditionLanguageValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const EditionLanguageContext = createContext<EditionLanguageValue | null>(null);
