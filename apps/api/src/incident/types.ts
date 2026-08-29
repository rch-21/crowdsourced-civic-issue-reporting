export const INCIDENT_STATUSES = ['open','verified','assigned','in_progress','pending_verification','resolved','closed','reopened','flagged'] as const;
export type IncidentStatus = typeof INCIDENT_STATUSES[number];
export type IncidentAssignmentStatus = 'assigned'|'accepted'|'in_progress'|'completed'|'cancelled';
export const INCIDENT_TRANSITIONS: Record<IncidentStatus, readonly IncidentStatus[]> = {
  open:['verified','assigned'], verified:['assigned','reopened'], assigned:['in_progress','reopened'],
  in_progress:['pending_verification','reopened'], pending_verification:['resolved','flagged','reopened'],
  resolved:['closed','reopened'], closed:['reopened'], reopened:['verified','assigned','in_progress'], flagged:['assigned','reopened']
};
export function canIncidentTransition(from:IncidentStatus,to:IncidentStatus){return INCIDENT_TRANSITIONS[from]?.includes(to)??false;}
export function assertIncidentTransition(from:IncidentStatus,to:IncidentStatus){if(!canIncidentTransition(from,to))throw new Error(`INVALID_INCIDENT_STATUS_TRANSITION:${from}:${to}`);}
