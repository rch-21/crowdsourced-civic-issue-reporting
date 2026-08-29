import { api } from '../lib/http';

export type ReportSummary = {
  id: string;
  categoryId: string;
  description: string;
  workStatus: string;
  reportedAt: string;
  incidentId: string | null;
  address?: string | null;
};

export type ReportDetail = ReportSummary & {
  latitude: number;
  longitude: number;
  address: string | null;
  citizenId: string;
  comments?: { id: string; body: string; createdAt: string }[];
  feedback?: { rating: number; body: string | null; createdAt: string }[];
  media?: { storageKey: string; mediaType: string; fileSize: number; metadata?: { dataUrl?: string } }[];
  resolution?: { note: string | null; submittedAt: string; overallResult: string; confidence: number; evidence: unknown; media?: { storageKey: string; mediaType: string; capturedAt: string | null; metadata?: { dataUrl?: string | null } }[] } | null;
};

export function createReport(input: {
  categoryId: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  media?: { storageKey: string; mediaType: string; fileSize: number; dataUrl: string }[];
}) {
  return api<{ id: string; incidentId: string; clustered?: boolean; clusterConfidence?: number; departmentCode?: string | null }>('/reports', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}
export function nearbyIncidents(input: { categoryId: string; latitude: number; longitude: number; description?: string }) { return api<any[]>('/reports/nearby', { method: 'POST', body: JSON.stringify(input) }); }
export function upvoteIncident(id: string) { return api<{ voted: boolean; alreadyVoted: boolean }>(`/incidents/${id}/upvote`, { method: 'POST' }); }

export function myReports() {
  return api<ReportSummary[]>('/reports/mine');
}

export function report(id: string) {
  return api<ReportDetail>(`/reports/${id}`);
}

export function addComment(id: string, body: string) {
  return api(`/reports/${id}/comments`, { method: 'POST', body: JSON.stringify({ body }) });
}

export function vote(id: string) {
  return api(`/reports/${id}/vote`, { method: 'POST' });
}

export function submitFeedback(id: string, rating: number, body: string) {
  return api(`/reports/${id}/feedback`, { method: 'POST', body: JSON.stringify({ rating, body }) });
}

export function changeStatus(id: string, status: string) {
  return api(`/reports/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export function duplicateCandidates(id: string) {
  return api<any[]>(`/clustering/reports/${id}/candidates`);
}
