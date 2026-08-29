const API = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
const SESSION_KEY = 'civic_session';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string | undefined,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function sessionToken(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionToken(token: string) {
  localStorage.setItem(SESSION_KEY, token);
}

export function clearSessionToken() {
  localStorage.removeItem(SESSION_KEY);
}

export function userFacingMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Sign in to continue.';
    if (error.status === 403) return 'You do not have permission for this action.';
    if (error.status === 404) return 'This record is no longer available.';
    if (error.status === 409) return 'This action is not available for the current status.';
    if (error.status >= 500) return 'The civic service is temporarily unavailable.';
    return error.message || fallback;
  }
  if (error instanceof Error && error.message === 'NO_SESSION') return 'Sign in to continue.';
  return fallback;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = sessionToken();
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API}${path}`, { ...options, headers });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      response.status,
      body.error,
      body.message ?? fallbackForStatus(response.status)
    );
  }
  return body as T;
}

function fallbackForStatus(status: number) {
  if (status === 401) return 'Sign in to continue.';
  if (status === 403) return 'You do not have permission for this action.';
  if (status >= 500) return 'The civic service is temporarily unavailable.';
  return 'Unable to complete the request.';
}
