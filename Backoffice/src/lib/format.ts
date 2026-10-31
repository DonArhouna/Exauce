const LOCALES: Record<string, string> = { fr: 'fr-FR', en: 'en-GB' };

/** Date et heure lisibles, ou tiret si la valeur est absente. */
export function formatDateTime(value: string | null | undefined, lang: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(LOCALES[lang] ?? LOCALES.fr, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/** Nombre lisible selon la langue active. */
export function formatNumber(value: number, lang: string): string {
  return new Intl.NumberFormat(LOCALES[lang] ?? LOCALES.fr).format(value);
}
