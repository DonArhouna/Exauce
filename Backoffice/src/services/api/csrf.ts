/**
 * Le jeton CSRF n'est jamais un secret d'authentification : il est recopié
 * depuis le cookie lisible `csrf_token` (ou le corps de login) vers l'en-tête
 * `X-CSRF-Token`. Il reste uniquement en mémoire.
 */
let memoryToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  memoryToken = token;
}

export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const value = part.trim();
    if (value.startsWith(prefix)) {
      return decodeURIComponent(value.slice(prefix.length));
    }
  }
  return null;
}

export function getCsrfToken(): string | null {
  return memoryToken ?? readCookie('csrf_token');
}
