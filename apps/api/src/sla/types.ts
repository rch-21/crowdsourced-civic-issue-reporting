export type RiskLevel = 'ON_TRACK' | 'AT_RISK' | 'BREACHED';

export interface SlaPolicy {
  priority: string;
  responseHours: number;
  resolutionHours: number;
  escalationHoursAfterBreach: number;
}

export interface SlaEvaluation {
  dueAt: string;
  breached: boolean;
  hoursRemaining: number;
  riskLevel: RiskLevel;
}

/**
 * Pure, deterministic SLA math: given the priority's configured resolution window,
 * compute the due date from creation time and classify risk relative to "now"
 * (or relative to resolvedAt, if the incident is already closed out).
 * AT_RISK is anything due within 24 hours that has not yet breached.
 */
export function evaluateSlaStatus(createdAt: string, resolutionHours: number, now: Date, resolvedAt: string | null): SlaEvaluation {
  const due = new Date(new Date(createdAt).getTime() + resolutionHours * 3600000);
  const reference = resolvedAt ? new Date(resolvedAt) : now;
  const breached = reference.getTime() > due.getTime();
  const hoursRemaining = Math.round(((due.getTime() - reference.getTime()) / 3600000) * 10) / 10;
  const riskLevel: RiskLevel = breached ? 'BREACHED' : hoursRemaining <= 24 ? 'AT_RISK' : 'ON_TRACK';
  return { dueAt: due.toISOString(), breached, hoursRemaining, riskLevel };
}

/** Escalation level increases by one for each full escalation window elapsed since breach. */
export function escalationLevelFor(hoursSinceBreach: number, escalationHours: number): number {
  return Math.max(1, Math.floor(hoursSinceBreach / escalationHours) + 1);
}
