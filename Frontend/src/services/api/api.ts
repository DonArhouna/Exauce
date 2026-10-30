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

/**
 * Envoi du formulaire de contact — mock. Aucune donnée ne quitte le navigateur.
 * POST /contact
 */
export async function sendContactMessage(payload: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<{ ok: true }> {
  void payload;
  await new Promise((r) => setTimeout(r, 600));
  return { ok: true };
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
