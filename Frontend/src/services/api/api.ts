import { Publication, PublicationCategory } from '@/types/content';
import { PUBLICATIONS_MOCK } from '@/data/content.data';

/**
 * Publications — mocks triés/façonnés localement. Le backend FastAPI
 * remplacera les corps de fonctions par des appels HTTP, en conservant
 * les mêmes signatures (contrat : /docs/api-contract.md).
 */

/** GET /publications — filtrage + recherche + tri, pagination serveur future. */
export async function fetchPublications(params?: {
  category?: PublicationCategory;
  q?: string;
}): Promise<Publication[]> {
  void params;
  await new Promise((r) => setTimeout(r, 120)); // latence simulée
  return PUBLICATIONS_MOCK;
}

/** GET /publications/{slug} */
export async function fetchPublicationBySlug(slug: string): Promise<Publication | null> {
  await new Promise((r) => setTimeout(r, 80));
  return PUBLICATIONS_MOCK.find((p) => p.slug.fr === slug || p.slug.en === slug) ?? null;
}

export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  lang: string;
  honeypot?: string;
  elapsed_ms?: number;
}

export interface ContactResponse {
  id: string;
  status: 'new';
}

/**
 * Envoi du formulaire de contact — mock conforme au contrat OpenAPI (POST /contact - EF-301..303).
 * Valide le payload et l'en-tête Idempotency-Key avec réponse HTTP 202 simulée.
 */
export async function sendContactMessage(
  payload: ContactPayload,
  options?: { idempotencyKey?: string },
): Promise<ContactResponse> {
  void payload;
  void options;
  await new Promise((r) => setTimeout(r, 600));
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'c0a80101-0000-4000-8000-000000000001',
    status: 'new',
  };
}

/**
 * Connexion Espace Client — UI uniquement pour l'instant.
 * POST /auth/login (à venir — le mock échoue volontairement poliment)
 */
export async function mockLogin(
  inputs: { username: string; password: string },
): Promise<never> {
  void inputs;
  await new Promise((r) => setTimeout(r, 500));
  throw new Error('not-implemented');
}
