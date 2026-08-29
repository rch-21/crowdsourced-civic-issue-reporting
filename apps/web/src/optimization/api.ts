import { api } from '../lib/http';

export function generateRecommendations(incident: {
  id: string;
  latitude: number;
  longitude: number;
  impactScore: number;
  severity: number;
  slaDueAt?: string | null;
  estimatedWorkMinutes: number;
  requiredSkills: string[];
  departmentId?: string | null;
}) {
  return api<{ recommendations: any[]; message?: string; decisionRequired: boolean }>('/optimization/recommendations', {
    method: 'POST',
    body: JSON.stringify({ incident })
  });
}

export type Recommendation = {
  id?: string;
  worker_user_id?: string;
  workerUserId?: string;
  workerName?: string;
  rank: number;
  score: number;
  estimated_travel_km?: number;
  rationale: Record<string, unknown>;
};

export function getRecommendations(incidentId: string) {
  return api<Recommendation[]>(`/optimization/recommendations/${incidentId}`);
}

export function decideRecommendation(id: string, decision: string, selectedWorkerUserId?: string, note?: string) {
  return api(`/optimization/recommendations/${id}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision, selectedWorkerUserId: selectedWorkerUserId ?? null, note })
  });
}
