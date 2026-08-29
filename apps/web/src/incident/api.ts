import { api } from '../lib/http';

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
  affectedPopulation: number;
  slaDueAt: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export function incidentQueue() {
  return api<QueueRow[]>('/incidents/queue');
}

export function incidentDetail(id: string) {
  return api<any>(`/incidents/${id}`);
}

export function myIncidents() {
  return api<any[]>('/officers/me/incidents');
}

export function assignIncident(id: string, input: { assigneeUserId?: string; teamId?: string; dueAt?: string }) {
  return api(`/incidents/${id}/assign`, { method: 'POST', body: JSON.stringify(input) });
}

export function incidentStatus(id: string, status: string, note?: string) {
  return api(`/incidents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, note }) });
}

export function incidentImpact(id: string) {
  return api<any>(`/incidents/${id}/impact`);
}

export function rankedImpact() {
  return api<any[]>('/incidents/impact/ranked');
}

export function populationEstimate(id: string) {
  return api<any>(`/incidents/${id}/population-estimate`);
}

export function savePopulationEstimate(id: string, input: Record<string, unknown>) {
  return api(`/incidents/${id}/population-estimate`, { method: 'POST', body: JSON.stringify(input) });
}

export function submitResolution(id: string, input: { resolutionLatitude: number | null; resolutionLongitude: number | null; note?: string }) {
  return api(`/incidents/${id}/resolution-verification`, {
    method: 'POST',
    body: JSON.stringify({ ...input, media: [] })
  });
}

export function clusterMembers(id: string) {
  return api<any[]>(`/incidents/${id}/cluster`);
}
