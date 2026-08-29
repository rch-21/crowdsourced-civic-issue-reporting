import { db } from '../lib/database.js';
import { assertTransition } from './state-machine.js';
import { createReport, findNearbyIncidents, getReport, listReports } from './repository.js';
import { calculateIncidentImpact } from '../impact/service.js';
import type { ReportWorkStatus } from './types.js';

export { createReport, findNearbyIncidents, getReport, listReports };

export async function upvoteIncident(incidentId: string, userId: string) {
  const report = (await db.query(`SELECT id FROM reports WHERE incident_id=$1 ORDER BY reported_at ASC LIMIT 1`, [incidentId])).rows[0];
  if (!report) throw new Error('INCIDENT_NOT_FOUND');
  const already = (await db.query(`SELECT 1 FROM report_votes rv JOIN reports r ON r.id=rv.report_id WHERE r.incident_id=$1 AND rv.user_id=$2 LIMIT 1`, [incidentId,userId])).rows[0];
  if (already) return { voted: false, alreadyVoted: true };
  await db.query(`INSERT INTO report_votes(report_id,user_id,value) VALUES($1,$2,1)`, [report.id,userId]);
  await calculateIncidentImpact(incidentId);
  return { voted: true, alreadyVoted: false };
}

export async function changeStatus(reportId: string, actorId: string, to: ReportWorkStatus, note?: string) {
  const report = await getReport(reportId);
  if (!report) throw new Error('REPORT_NOT_FOUND');
  assertTransition(report.workStatus, to);
  if (to === 'CONFIRMED') {
    if (report.workStatus !== 'RESOLVED' || !report.incidentId) throw new Error('CONFIRMATION_NOT_AVAILABLE');
    const proof=(await db.query(`SELECT v.overall_result FROM resolution_verifications v JOIN resolution_submissions s ON s.id=v.submission_id WHERE s.incident_id=$1 ORDER BY v.created_at DESC LIMIT 1`,[report.incidentId])).rows[0];
    if (proof?.overall_result !== 'PASS') throw new Error('CONFIRMATION_NOT_AVAILABLE');
  }
  await db.query('BEGIN');
  try {
    await db.query(`UPDATE reports SET work_status=$1, updated_at=now() WHERE id=$2`, [to, reportId]);
    await db.query(`INSERT INTO report_status_history (report_id,actor_user_id,from_status,to_status,note) VALUES ($1,$2,$3,$4,$5)`, [reportId,actorId,report.workStatus,to,note ?? null]);
    if (to === 'RESOLVED') await db.query(`INSERT INTO report_notifications (user_id,report_id,type,title,body) VALUES ($1,$2,'STATUS','Report resolved','Your report has been marked resolved')`, [report.citizenId,reportId]);
    if (to === 'CONFIRMED' && report.incidentId) {
      await db.query(`UPDATE reports SET work_status='CONFIRMED',updated_at=now() WHERE incident_id=$1 AND work_status='RESOLVED'`, [report.incidentId]);
      await db.query(`UPDATE incidents SET status='resolved',resolved_at=COALESCE(resolved_at,now()),updated_at=now() WHERE id=$1`, [report.incidentId]);
      await db.query(`INSERT INTO confirmations(incident_id,user_id,result,notes) VALUES($1,$2,'confirmed',$3)`, [report.incidentId, actorId, note ?? 'Citizen confirmed the resolution']);
      await db.query(`INSERT INTO incident_history(incident_id,actor_user_id,event_type,details) VALUES($1,$2,'CITIZEN_CONFIRMED_RESOLUTION',$3)`, [report.incidentId, actorId, JSON.stringify({ reportId, note: note ?? null })]);
    }
    await db.query('COMMIT');
  } catch (e) { await db.query('ROLLBACK'); throw e; }
}

export async function addComment(reportId: string, userId: string, body: string) {
  await db.query(`INSERT INTO report_comments(report_id,author_user_id,body) VALUES ($1,$2,$3)`, [reportId,userId,body]);
}

export async function vote(reportId: string, userId: string) {
  await db.query(`INSERT INTO report_votes(report_id,user_id) VALUES ($1,$2) ON CONFLICT (report_id,user_id) DO NOTHING`, [reportId,userId]);
}

export async function feedback(reportId: string, userId: string, rating: number, body?: string) {
  await db.query(`INSERT INTO report_feedback(report_id,user_id,rating,body) VALUES ($1,$2,$3,$4)`, [reportId,userId,rating,body ?? null]);
  const report = await getReport(reportId);
  if (report?.incidentId) await calculateIncidentImpact(report.incidentId);
}
