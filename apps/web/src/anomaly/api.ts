import { api } from '../lib/http';

export type PostResolutionAnomaly = {
  id: string;
  resolved_incident_id: string;
  anomaly_type: string;
  confidence: number;
  evidence: Record<string, unknown>;
  detected_at: string;
};

export const getPostResolutionAnomalies = () => api<PostResolutionAnomaly[]>('/post-resolution-anomalies');
export const reviewPostResolutionAnomaly = (
  id: string,
  decision: 'DISMISS' | 'REOPEN' | 'CREATE_INCIDENT' | 'LINK_INCIDENT' | 'REQUEST_INSPECTION',
  note?: string
) => api(`/post-resolution-anomalies/${id}/review`, { method: 'POST', body: JSON.stringify({ decision, note }) });
