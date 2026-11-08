import { apiRequest } from '../client';
import type { AdminOffice, OfficeList, OfficeWrite } from '../types';

/** `GET /admin/offices` — bureaux triés par position. */
export async function listOffices(): Promise<OfficeList> {
  return apiRequest<OfficeList>('/admin/offices');
}

/** `POST /admin/offices` — création d'un bureau. */
export async function createOffice(input: OfficeWrite): Promise<AdminOffice> {
  return apiRequest<AdminOffice>('/admin/offices', { method: 'POST', body: input });
}

/** `PATCH /admin/offices/{id}` — coordonnées, statut, siège et position. */
export async function updateOffice(id: string, input: OfficeWrite): Promise<AdminOffice> {
  return apiRequest<AdminOffice>(`/admin/offices/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
  });
}

/** `DELETE /admin/offices/{id}` — refusée pour le siège sans successeur. */
export async function deleteOffice(id: string): Promise<void> {
  await apiRequest<void>(`/admin/offices/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
