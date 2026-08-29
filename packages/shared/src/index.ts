export const API_VERSION = 'v1';

export type HealthStatus = {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  checks: { database: 'up' | 'down' };
};
