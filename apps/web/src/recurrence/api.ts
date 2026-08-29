import { api } from '../lib/http';

export function infrastructureHistory(id: string) {
  return api<any>(`/infrastructure/${id}/history`);
}
