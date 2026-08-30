import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth, requirePermission, permissionsForRole } from '../auth/middleware.js';
import { PERMISSIONS } from '../auth/types.js';
import { addComment, changeStatus, createReport, feedback, findNearbyIncidents, getReport, listReports, upvoteIncident, vote } from './service.js';
import { REPORT_STATUSES, type ReportWorkStatus } from './types.js';

const createSchema = z.object({ categoryId:z.string().uuid(), description:z.string().trim().min(5).max(5000), latitude:z.number().min(-90).max(90), longitude:z.number().min(-180).max(180), address:z.string().trim().max(500).optional(), wardId:z.string().uuid().optional(), departmentId:z.string().uuid().optional(), media:z.array(z.object({storageKey:z.string().min(1),mediaType:z.string().min(1),fileSize:z.number().int().nonnegative(),dataUrl:z.string().regex(/^data:(image\/(jpeg|jpg)|audio\/(webm|ogg|mp4|mpeg|wav|mp3));base64,/i).max(12000000)})).max(3).optional() });
const statusSchema = z.object({ status:z.enum(REPORT_STATUSES), note:z.string().trim().max(1000).optional() });
const commentSchema = z.object({ body:z.string().trim().min(1).max(2000) });
const feedbackSchema = z.object({ rating:z.number().int().min(1).max(5), body:z.string().trim().max(2000).optional() });
const nearbySchema = z.object({ categoryId:z.string().uuid(), latitude:z.number().min(-90).max(90), longitude:z.number().min(-180).max(180), description:z.string().trim().max(5000).optional() });

function ownerOrForbidden(request:any, reply:any, report:any) {
  if (request.user.role === 'citizen' && report.citizenId !== request.user.id) { reply.code(403).send({error:'FORBIDDEN'}); return false; }
  return true;
}

export async function reportingRoutes(app: FastifyInstance) {
  app.post('/reports', { preHandler: requirePermission(PERMISSIONS.REPORT_CREATE) }, async (request, reply) => {
    const input = createSchema.parse(request.body);
    try {
      return reply.code(201).send(await createReport({ ...input, citizenId: request.user!.id }));
    } catch (e: any) {
      if (e.message === 'REPORT_REJECTED_ABUSE_PROTECTION') {
        return reply.code(429).send({ error: e.message, message: 'This submission was blocked by spam protection. If this is a mistake, contact support.', reason: e.reason });
      }
      throw e;
    }
  });
  app.get('/reports/mine', { preHandler: requirePermission(PERMISSIONS.REPORT_OWN_READ) }, async (request) => listReports(request.user!.id));
  app.post('/reports/nearby', { preHandler: requirePermission(PERMISSIONS.REPORT_CREATE) }, async (request) => findNearbyIncidents(nearbySchema.parse(request.body)));
  app.post('/incidents/:id/upvote', { preHandler: requirePermission(PERMISSIONS.VOTE_CREATE) }, async (request:any, reply) => { try { return reply.send(await upvoteIncident(request.params.id,request.user!.id)); } catch (e:any) { if (e.message==='INCIDENT_NOT_FOUND') return reply.code(404).send({error:e.message}); throw e; } });
  app.get('/reports/:id', { preHandler: requireAuth }, async (request:any, reply) => { const report=await getReport(request.params.id); if (!report) return reply.code(404).send({error:'REPORT_NOT_FOUND'}); if (!ownerOrForbidden(request,reply,report)) return; return report; });
  app.patch('/reports/:id/status', { preHandler: requireAuth }, async (request:any, reply) => { const input=statusSchema.parse(request.body); const report=await getReport(request.params.id); if (!report) return reply.code(404).send({error:'REPORT_NOT_FOUND'}); const allowed=permissionsForRole(request.user.role).includes(PERMISSIONS.STATUS_UPDATE); const citizenAction=request.user.role==='citizen' && ['REOPENED','CONFIRMED'].includes(input.status) && report.citizenId===request.user.id; if (!allowed && !citizenAction) return reply.code(403).send({error:'FORBIDDEN'}); try { await changeStatus(request.params.id,request.user.id,input.status as ReportWorkStatus,input.note); return {status:input.status}; } catch (e:any) { if (e.message?.startsWith('INVALID_STATUS') || e.message==='CONFIRMATION_NOT_AVAILABLE') return reply.code(409).send({error:e.message}); throw e; } });
  app.post('/reports/:id/comments', { preHandler: requirePermission(PERMISSIONS.COMMENT_CREATE) }, async (request:any) => { const input=commentSchema.parse(request.body); await addComment(request.params.id,request.user!.id,input.body); return {created:true}; });
  app.post('/reports/:id/vote', { preHandler: requirePermission(PERMISSIONS.VOTE_CREATE) }, async (request:any) => { await vote(request.params.id,request.user!.id); return {voted:true}; });
  app.post('/reports/:id/feedback', { preHandler: requirePermission(PERMISSIONS.FEEDBACK_CREATE) }, async (request:any) => { const input=feedbackSchema.parse(request.body); await feedback(request.params.id,request.user!.id,input.rating,input.body); return {created:true}; });
}
