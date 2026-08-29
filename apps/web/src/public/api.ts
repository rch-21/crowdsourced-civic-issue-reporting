import { api } from '../lib/http';

export type PublicDashboard = {
  summary: Record<string, unknown>;
  wards: Record<string, unknown>[];
  departments: Record<string, unknown>[];
  hotspots: Record<string, unknown>[];
  trends: Record<string, unknown>[];
};

export function getPublicDashboard() {
  return api<PublicDashboard>('/public/dashboard');
}

export type PublicIncident = {
  id: string;
  category_id: string;
  category_name: string;
  ward_id: string | null;
  ward_name: string | null;
  status: string;
  impact_score: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  latitude: number;
  longitude: number;
  created_at: string;
  resolved_at: string | null;
};

export function getPublicIncidents() {
  return api<{ incidents: PublicIncident[] }>('/public/incidents');
}
