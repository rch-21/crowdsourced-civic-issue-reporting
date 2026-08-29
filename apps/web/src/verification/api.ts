import { api } from '../lib/http';

export function verificationDetail(id: string) {
  return api<any>(`/incidents/${id}/verification`);
}

export function reviewVerification(id: string, decision: 'APPROVE' | 'REJECT' | 'REQUEST_EVIDENCE', note?: string) {
  return api(`/verification/${id}/review`, { method: 'POST', body: JSON.stringify({ decision, note }) });
}
