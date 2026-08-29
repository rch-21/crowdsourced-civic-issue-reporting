import { api } from '../lib/http';

export type NotificationRow = {
  id: string;
  event_type: string;
  channel: string;
  title_key: string;
  body_key: string;
  payload: Record<string, unknown>;
  status: string;
  created_at: string;
  sent_at: string | null;
};

export function listNotifications() {
  return api<NotificationRow[]>('/notifications');
}

export function saveLocale(locale: string) {
  return api('/notifications/locale', { method: 'PUT', body: JSON.stringify({ locale }) });
}
