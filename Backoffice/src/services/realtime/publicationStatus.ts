import { API_MODE } from '../api/client';
import { subscribeMockPublication } from '../api/mock/db';
import type { PublicationJob } from '../api/types';

/**
 * Flux `GET /admin/publication-status` : événements `publication.job`,
 * heartbeat ignoré. En mode mock, un émetteur local reproduit le protocole.
 */
export function subscribePublicationStatus(onJob: (job: PublicationJob) => void): () => void {
  if (API_MODE === 'mock') return subscribeMockPublication(onJob);

  const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';
  const source = new EventSource(`${base}/admin/publication-status`, { withCredentials: true });

  const handler = (event: MessageEvent<string>) => {
    try {
      onJob(JSON.parse(event.data) as PublicationJob);
    } catch {
      // Trame malformée : ignorée sans casser le flux.
    }
  };

  source.addEventListener('publication.job', handler as EventListener);
  return () => source.close();
}
