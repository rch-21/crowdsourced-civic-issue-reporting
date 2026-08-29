import type { ReportWorkStatus } from './types.js';

const transitions: Record<ReportWorkStatus, readonly ReportWorkStatus[]> = {
  REPORTED: ['ACKNOWLEDGED','FLAGGED'],
  ACKNOWLEDGED: ['ASSIGNED','FLAGGED'],
  ASSIGNED: ['IN_PROGRESS','FLAGGED'],
  IN_PROGRESS: ['PENDING_VERIFICATION','FLAGGED'],
  PENDING_VERIFICATION: ['RESOLVED','FLAGGED'],
  RESOLVED: ['CONFIRMED','REOPENED'],
  CONFIRMED: ['REOPENED'],
  REOPENED: ['ACKNOWLEDGED','ASSIGNED','IN_PROGRESS','FLAGGED'],
  FLAGGED: ['ACKNOWLEDGED','ASSIGNED','REOPENED']
};

export function canTransition(from: ReportWorkStatus, to: ReportWorkStatus) {
  return transitions[from]?.includes(to) ?? false;
}

export function assertTransition(from: ReportWorkStatus, to: ReportWorkStatus) {
  if (!canTransition(from, to)) throw new Error(`INVALID_STATUS_TRANSITION:${from}:${to}`);
}

export function allowedTransitions(status: ReportWorkStatus) {
  return transitions[status] ?? [];
}

export const statusTransitions = transitions;
