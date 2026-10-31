export const DASHBOARD_PATH = '/tableau-de-bord';
export const LOGIN_PATH = '/connexion';

/**
 * N'accepte qu'un chemin interne : évite les redirections ouvertes
 * (`//evil.example`, URL absolues, schémas).
 */
export function safeRedirect(value: string | null | undefined, fallback = DASHBOARD_PATH): string {
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  if (value.includes('://')) return fallback;
  return value;
}
