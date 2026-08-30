import { db } from '../lib/database.js';
import { notify } from '../notifications/service.js';
import { evaluateSlaStatus, escalationLevelFor } from './types.js';

export async function getPolicies() {
  const { rows } = await db.query(
    `SELECT priority,response_hours "responseHours",resolution_hours "resolutionHours",escalation_hours_after_breach "escalationHoursAfterBreach" FROM sla_policies ORDER BY resolution_hours`
  );
  return rows;
}

/**
 * Recomputes an incident's SLA due date from its current impact priority and persists it.
 * Called after every impact score recalculation, since priority can change as new
 * reports/votes/feedback arrive and the SLA window must track the latest priority.
 */
export async function recalculateSla(incidentId: string) {
  const incident = (
    await db.query(
      `SELECT i.created_at AS "createdAt", i.resolved_at AS "resolvedAt", i.status,
              COALESCE((SELECT priority FROM incident_impact_scores s WHERE s.incident_id=i.id ORDER BY calculated_at DESC LIMIT 1),'LOW') AS priority
       FROM incidents i WHERE i.id=$1`,
      [incidentId]
    )
  ).rows[0];
  if (!incident) return null;

  const policy = (await db.query(`SELECT resolution_hours "resolutionHours" FROM sla_policies WHERE priority=$1`, [incident.priority])).rows[0] ?? { resolutionHours: 336 };
  const evaluation = evaluateSlaStatus(incident.createdAt, policy.resolutionHours, new Date(), incident.resolvedAt);
  const closed = ['resolved', 'closed'].includes(incident.status);

  await db.query(
    `UPDATE incidents SET sla_due_at=$1, sla_breached_at=CASE WHEN $2 AND NOT $3 THEN COALESCE(sla_breached_at, now()) WHEN $3 THEN NULL ELSE sla_breached_at END WHERE id=$4`,
    [evaluation.dueAt, evaluation.breached, closed && !evaluation.breached, incidentId]
  );

  return { incidentId, priority: incident.priority, ...evaluation };
}

export async function listAtRisk() {
  const { rows } = await db.query(
    `SELECT i.id AS "incidentId", ic.name AS "categoryName", i.status, i.sla_due_at AS "dueAt", i.sla_breached_at AS "breachedAt",
            COALESCE((SELECT priority FROM incident_impact_scores s WHERE s.incident_id=i.id ORDER BY calculated_at DESC LIMIT 1),'LOW') AS priority
     FROM incidents i JOIN issue_categories ic ON ic.id=i.category_id
     WHERE i.status NOT IN ('resolved','closed') AND i.sla_due_at IS NOT NULL AND i.sla_due_at < now() + interval '24 hours'
     ORDER BY i.sla_due_at ASC`
  );
  return rows;
}

/**
 * Scans open, breached incidents and creates/escalates records when the incident has
 * stayed breached past the policy's escalation window. Idempotent: re-running does not
 * duplicate an escalation level that already exists. Notifies supervisors on each new level.
 */
export async function checkAndEscalate() {
  const breaching = (
    await db.query(
      `SELECT i.id, i.sla_breached_at AS "breachedAt", sp.escalation_hours_after_breach AS "escalationHours"
       FROM incidents i
       JOIN sla_policies sp ON sp.priority = COALESCE((SELECT priority FROM incident_impact_scores s WHERE s.incident_id=i.id ORDER BY calculated_at DESC LIMIT 1),'LOW')
       WHERE i.status NOT IN ('resolved','closed') AND i.sla_breached_at IS NOT NULL`
    )
  ).rows;

  let created = 0;
  for (const row of breaching) {
    const hoursSinceBreach = (Date.now() - new Date(row.breachedAt).getTime()) / 3600000;
    const level = escalationLevelFor(hoursSinceBreach, row.escalationHours);
    const existing = (await db.query(`SELECT level FROM incident_escalations WHERE incident_id=$1 ORDER BY level DESC LIMIT 1`, [row.id])).rows[0];
    if (existing && existing.level >= level) continue;

    const inserted = (await db.query(`INSERT INTO incident_escalations(incident_id,level,reason) VALUES($1,$2,'SLA_BREACH') RETURNING id`, [row.id, level])).rows[0];
    await db.query(`INSERT INTO incident_history(incident_id,event_type,details) VALUES($1,'SLA_ESCALATED',$2)`, [row.id, JSON.stringify({ level, escalationId: inserted.id })]);
    created += 1;

    const supervisors = (await db.query(`SELECT u.id FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name IN ('supervisor','administrator') AND u.status='active'`)).rows;
    for (const supervisor of supervisors) {
      await notify({
        userId: supervisor.id,
        event: 'SLA_BREACH',
        channel: 'EMAIL',
        dedupeKey: `escalation-${row.id}-level-${level}`,
        titleKey: 'sla_breach',
        bodyKey: 'sla_breach_body',
        payload: { incidentId: row.id, level }
      }).catch(() => undefined);
    }
  }
  return { escalationsCreated: created };
}

export async function listEscalations(incidentId?: string) {
  const values: unknown[] = [];
  const where = incidentId ? (values.push(incidentId), 'WHERE e.incident_id=$1') : '';
  const { rows } = await db.query(
    `SELECT e.id, e.incident_id AS "incidentId", e.level, e.reason, e.status, e.triggered_at AS "triggeredAt", e.acknowledged_at AS "acknowledgedAt", e.notes
     FROM incident_escalations e ${where} ORDER BY e.triggered_at DESC`,
    values
  );
  return rows;
}

export async function acknowledgeEscalation(id: string, userId: string, notes?: string) {
  const { rows } = await db.query(
    `UPDATE incident_escalations SET status='ACKNOWLEDGED', acknowledged_at=now(), acknowledged_by_user_id=$1, notes=COALESCE($2,notes) WHERE id=$3 AND status='OPEN' RETURNING id`,
    [userId, notes ?? null, id]
  );
  if (!rows[0]) throw new Error('ESCALATION_NOT_FOUND_OR_ALREADY_HANDLED');
  return { id, status: 'ACKNOWLEDGED' };
}
