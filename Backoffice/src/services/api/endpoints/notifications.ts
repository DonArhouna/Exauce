import { apiRequest } from '../client';
import type { AdminNotificationList } from '../types';

export async function listNotifications(params?: {
  unread_only?: boolean;
  limit?: number;
}): Promise<AdminNotificationList> {
  return apiRequest<AdminNotificationList>('/admin/notifications', { query: params });
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiRequest<void>(`/admin/notifications/${id}/read`, { method: 'POST' });
}
