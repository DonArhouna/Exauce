import { apiRequest } from '../client';
import type { AdminDashboard } from '../types';

/** `GET /admin/reports/dashboard` — agrégats de synthèse. */
export async function getDashboard(): Promise<AdminDashboard> {
  return apiRequest<AdminDashboard>('/admin/reports/dashboard');
}
