import { api } from '../lib/http';

export const maintenanceQueue = () => api<any[]>('/predictive-maintenance/queue');
export const predictionFeedback = (id: string, input: { outcome: string }) =>
  api(`/predictive-maintenance/predictions/${id}/feedback`, { method: 'POST', body: JSON.stringify(input) });
