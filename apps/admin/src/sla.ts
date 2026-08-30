import type { QueueRow } from './http';

export type SlaBadge = { label: string; tone: '' | 'ok' | 'warning' | 'danger' };

const CLOSED_STATUSES = ['resolved', 'closed'];

/**
 * Mirrors the backend's evaluateSlaStatus risk classification (see apps/api/src/sla/types.ts)
 * using fields already present on the queue/history rows, so the UI doesn't need a
 * per-row round trip to /incidents/:id/sla just to render a badge.
 */
export function slaBadge(row: Pick<QueueRow, 'status' | 'slaDueAt' | 'slaBreachedAt'>): SlaBadge {
  const closed = CLOSED_STATUSES.includes(row.status);

  if (closed) {
    return row.slaBreachedAt ? { label: 'Breached SLA', tone: 'danger' } : { label: 'Met SLA', tone: 'ok' };
  }
  if (!row.slaDueAt) return { label: 'No SLA policy', tone: '' };
  if (row.slaBreachedAt) return { label: 'Breached', tone: 'danger' };

  const hoursRemaining = (new Date(row.slaDueAt).getTime() - Date.now()) / 3600000;
  if (hoursRemaining <= 24) return { label: 'At risk', tone: 'warning' };
  return { label: 'On track', tone: 'ok' };
}
