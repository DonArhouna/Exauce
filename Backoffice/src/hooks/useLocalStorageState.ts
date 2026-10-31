import { useEffect, useState } from 'react';

/** Petit état persistant (préférences d'affichage uniquement, jamais un jeton). */
export function useLocalStorageState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Stockage indisponible (navigation privée) : la préférence reste en mémoire.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
