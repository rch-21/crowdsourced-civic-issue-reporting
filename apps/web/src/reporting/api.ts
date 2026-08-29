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
};

export function createReport(input: {
  categoryId: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
}) {
  return api<{ id: string; incidentId: string; clustered?: boolean; clusterConfidence?: number }>('/reports', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

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
