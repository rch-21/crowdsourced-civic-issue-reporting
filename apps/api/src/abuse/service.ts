import { db } from '../lib/database.js';
import { evaluateVelocity, evaluateDuplicateContent, type AbuseSignal } from './types.js';

export async function recordAbuseEvent(userId: string | null, eventType: string, fingerprint: string | null, details: Record<string, unknown>) {
  await db.query(`INSERT INTO abuse_events(user_id,event_type,fingerprint,details) VALUES($1,$2,$3,$4)`, [userId, eventType, fingerprint, JSON.stringify(details)]);
}

/**
 * Evaluates a citizen's report submission for spam/abuse signals before it is created.
 * Always logs any signal detected to abuse_events (so supervisors/administrators can see
 * the pattern via /abuse/events even when it wasn't severe enough to block), and returns
 * whether the submission should be rejected outright.
 */
export async function evaluateReportForAbuse(citizenId: string, description: string): Promise<{ blocked: boolean; reason?: string }> {
  const recent = await db.query(
    `SELECT reported_at AS "reportedAt", description FROM reports WHERE citizen_id=$1 AND reported_at > now() - interval '24 hours' ORDER BY reported_at DESC LIMIT 50`,
    [citizenId]
  );
  const timestamps: string[] = recent.rows.map((r: any) => r.reportedAt);
  const descriptions: string[] = recent.rows.map((r: any) => r.description);

  const signals = [evaluateVelocity(timestamps), evaluateDuplicateContent(description, descriptions)].filter((s): s is AbuseSignal => s !== null);

  let blocked = false;
  let reason: string | undefined;
  for (const signal of signals) {
    await recordAbuseEvent(citizenId, signal.type, null, signal.details);
    if (signal.severity === 'BLOCK') { blocked = true; reason = signal.type; }
  }
  return { blocked, reason };
}

export async function listAbuseEvents(limit = 100) {
  const { rows } = await db.query(
    `SELECT e.id, e.user_id AS "userId", u.display_name AS "userDisplayName", e.event_type AS "eventType",
            e.fingerprint, e.details, e.created_at AS "createdAt"
     FROM abuse_events e LEFT JOIN users u ON u.id = e.user_id
     ORDER BY e.created_at DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

export async function abuseSummary() {
  const { rows } = await db.query(
    `SELECT event_type AS "eventType", COUNT(*)::int AS count, COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours')::int AS "last24h"
     FROM abuse_events GROUP BY event_type ORDER BY count DESC`
  );
  const flaggedUsers = (
    await db.query(
      `SELECT user_id AS "userId", u.display_name AS "userDisplayName", COUNT(*)::int AS "eventCount", MAX(e.created_at) AS "lastEventAt"
       FROM abuse_events e LEFT JOIN users u ON u.id = e.user_id
       WHERE e.user_id IS NOT NULL AND e.created_at > now() - interval '7 days'
       GROUP BY user_id, u.display_name ORDER BY "eventCount" DESC LIMIT 20`
    )
  ).rows;
  return { byType: rows, flaggedUsers };
}
