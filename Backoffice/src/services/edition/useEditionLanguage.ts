import { useContext } from 'react';
import { EditionLanguageContext } from './edition-context';

/** Langue d'édition du contenu (FR/EN), indépendante de l'interface. */
export function useEditionLanguage() {
  const context = useContext(EditionLanguageContext);
  if (!context) throw new Error('useEditionLanguage doit être utilisé dans un EditionLanguageProvider.');
  return context;
}
