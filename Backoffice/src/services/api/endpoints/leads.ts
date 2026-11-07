import { apiRequest } from '../client';
import type { AdminLeadDetail, LeadList, LeadListQuery, LeadStatus } from '../types';

function query(query: LeadListQuery): Record<string, string | number> {
  const params: Record<string, string | number> = { limit: query.limit, offset: query.offset };
  if (query.status && query.status !== 'all') params.status = query.status;
  if (query.search) params.search = query.search;
  if (query.sector) params.sector = query.sector;
  if (query.from) params.from = query.from;
  if (query.to) params.to = query.to;
  return params;
}

/** `GET /admin/leads` — demandes filtrées et compteurs par statut. */
export async function listLeads(filters: LeadListQuery): Promise<LeadList> {
  return apiRequest<LeadList>('/admin/leads', { query: query(filters) });
}

/** `GET /admin/leads/{id}` — détail avec notes internes. */
export async function getLead(id: string): Promise<AdminLeadDetail> {
  return apiRequest<AdminLeadDetail>(`/admin/leads/${encodeURIComponent(id)}`);
}

/** `PATCH /admin/leads/{id}/status` — changement de statut (verrou optimiste). */
export async function updateLeadStatus(
  id: string,
  input: { status: LeadStatus; revision: number },
): Promise<AdminLeadDetail> {
  return apiRequest<AdminLeadDetail>(`/admin/leads/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: input,
  });
}

/** `POST /admin/leads/{id}/notes` — note interne. */
export async function addLeadNote(id: string, body: string): Promise<AdminLeadDetail> {
  return apiRequest<AdminLeadDetail>(`/admin/leads/${encodeURIComponent(id)}/notes`, {
    method: 'POST',
    body: { body },
  });
}

/** `GET /admin/leads/export.csv` — CSV des demandes filtrées. */
export async function exportLeads(filters: LeadListQuery): Promise<string> {
  return apiRequest<string>('/admin/leads/export.csv', { query: query(filters) });
}

/** Déclenche le téléchargement d'un CSV déjà rendu par le serveur. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
