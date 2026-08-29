import { db } from '../lib/database.js';
import { assertTransition } from './state-machine.js';
import { createReport, getReport, listReports } from './repository.js';
import { calculateIncidentImpact } from '../impact/service.js';
import type { ReportWorkStatus } from './types.js';

export { createReport, getReport, listReports };

export async function changeStatus(reportId: string, actorId: string, to: ReportWorkStatus, note?: string) {
  const report = await getReport(reportId);
  if (!report) throw new Error('REPORT_NOT_FOUND');
  assertTransition(report.workStatus, to);
  await db.query('BEGIN');
  try {
    await db.query(`UPDATE reports SET work_status=$1, updated_at=now() WHERE id=$2`, [to, reportId]);
    await db.query(`INSERT INTO report_status_history (report_id,actor_user_id,from_status,to_status,note) VALUES ($1,$2,$3,$4,$5)`, [reportId,actorId,report.workStatus,to,note ?? null]);
    if (to === 'RESOLVED') await db.query(`INSERT INTO report_notifications (user_id,report_id,type,title,body) VALUES ($1,$2,'STATUS','Report resolved','Your report has been marked resolved')`, [report.citizenId,reportId]);
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
