import { apiRequest } from '../client';
import type { PublicationJob, PublicationJobList, PublicationSiteStatus } from '../types';

/** État courant du site public et du job en cours. */
export async function getPublicationStatus(): Promise<PublicationSiteStatus> {
  return apiRequest<PublicationSiteStatus>('/admin/publication-jobs/current');
}

export async function listPublicationJobs(params?: { limit?: number; offset?: number }): Promise<PublicationJobList> {
  return apiRequest<PublicationJobList>('/admin/publication-jobs', { query: params });
}

/** Déclenche un job de publication (bouton Publier). */
export async function triggerPublication(): Promise<PublicationJob> {
  return apiRequest<PublicationJob>('/admin/publication-jobs', { method: 'POST' });
}
