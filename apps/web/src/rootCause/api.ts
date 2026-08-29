import { api } from '../lib/http';

export function hypotheses() {
  return api<any[]>('/root-cause/hypotheses');
}

export function reviewHypothesis(id: string, status: 'accepted' | 'rejected' | 'requires_investigation', notes?: string) {
  return api(`/root-cause/hypotheses/${id}/review`, { method: 'PATCH', body: JSON.stringify({ status, notes }) });
}
