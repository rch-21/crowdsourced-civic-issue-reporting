const API = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
const SESSION_KEY = 'civic_admin_session';

export type User = { id: string; role: string; email: string | null; displayName: string };
export type QueueRow = {
  incidentId: string;
  categoryId: string;
  categoryName: string;
  status: string;
  createdAt: string;
  supportingReports: number;
  supportingCitizens: number;
  impactScore: number;
  priority: string;
  affectedPopulation: number | null;
  slaDueAt: string | null;
  supportingVotes?: number;
  latitude?: number | null;
  longitude?: number | null;
};

export class AdminApiError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}

export function token() { return localStorage.getItem(SESSION_KEY); }
export function saveToken(value: string) { localStorage.setItem(SESSION_KEY, value); }
export function clearToken() { localStorage.removeItem(SESSION_KEY); }

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const current = token();
  if (current) headers.set('Authorization', `Bearer ${current}`);
  let response: Response;
  try {
    response = await fetch(`${API}${path}`, { ...options, headers });
  } catch {
    throw new AdminApiError(0, 'The administrative service could not be reached. Check that the API is running and try again.', 'NETWORK_ERROR');
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorCode = typeof body.error === 'string' ? body.error : body.error?.code;
    const message = response.status >= 500
      ? 'The administrative service is temporarily unavailable. Please try again shortly.'
      : body.message ?? body.error?.message ?? 'The administrative request could not be completed.';
    throw new AdminApiError(response.status, message, errorCode);
  }
  return body as T;
}

export function login(email: string, password: string) {
  return api<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}
export function currentUser() { return api<{ user: User }>('/auth/me'); }
export function queue() { return api<QueueRow[]>('/incidents/queue'); }
export function history() { return api<QueueRow[]>('/incidents/history'); }
export function publicDashboard() { return api<{ summary: Record<string, unknown>; wards: Record<string, unknown>[]; hotspots: Record<string, unknown>[] }>('/public/dashboard'); }
export function incident(id: string) { return api<any>(`/incidents/${id}`); }
export function acknowledge(id: string) { return api(`/incidents/${id}/acknowledge`, { method: 'POST' }); }
export function verification(id: string) { return api<any>(`/incidents/${id}/verification`); }
export function submitResolution(id: string, payload: { resolutionLatitude: number | null; resolutionLongitude: number | null; note?: string; media: Array<{ storageKey: string; mediaType: string; capturedAt: string; sha256: string; dataUrl: string }> }) {
  return api<any>(`/incidents/${id}/resolution-verification`, { method: 'POST', body: JSON.stringify(payload) });
}
export function updateStatus(id: string, status: string) { return api(`/incidents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
