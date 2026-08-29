import { api, clearSessionToken, sessionToken, setSessionToken } from '../lib/http';

export type User = {
  id: string;
  role: 'citizen' | 'officer' | 'supervisor' | 'administrator' | 'public_viewer';
  email: string | null;
  displayName: string;
};

export async function login(email: string, password: string) {
  const result = await api<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  setSessionToken(result.token);
  return result;
}

export function register(displayName: string, email: string, password: string) {
  return api<{ userId: string; verificationToken: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ displayName, email, password })
  });
}

export function verify(token: string) {
  return api<{ verified: boolean }>('/auth/verify', { method: 'POST', body: JSON.stringify({ token }) });
}

export async function me() {
  if (!sessionToken()) throw new Error('NO_SESSION');
  return api<{ user: User }>('/auth/me');
}

export async function logout() {
  try {
    await api('/auth/logout', { method: 'POST' });
  } finally {
    clearSessionToken();
  }
}

export function categories() {
  return api<{ id: string; name: string; code: string; description: string | null }[]>('/reference/categories');
}

export function officers() {
  return api<{ id: string; displayName: string; role: string }[]>('/reference/officers');
}

export function departments() {
  return api<{ id: string; name: string; code: string; description: string | null }[]>('/reference/departments');
}

export function systemHealth() {
  return api<{ status: string; service: string; version: string; checks: { database: string } }>('/health');
}
