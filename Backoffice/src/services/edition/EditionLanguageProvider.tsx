import { useMemo, type ReactNode } from 'react';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { isLang, type Lang } from '@/i18n';
import { EditionLanguageContext } from './edition-context';

/** Préférence d'édition locale : valeur non sensible, aucun jeton. */
export function EditionLanguageProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useLocalStorageState<string>('exauce.bo.editionLang', 'fr');
  const lang: Lang = isLang(stored) ? stored : 'fr';

  const value = useMemo(() => ({ lang, setLang: (next: Lang) => setStored(next) }), [lang, setStored]);

  return <EditionLanguageContext.Provider value={value}>{children}</EditionLanguageContext.Provider>;
}
