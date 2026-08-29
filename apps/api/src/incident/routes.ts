import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireRole } from '../auth/middleware.js';
import { db } from '../lib/database.js';
import { acknowledgeIncident,getIncident,listIncidentQueue,listResolvedIncidentHistory,updateIncidentStatus } from './service.js';
import { calculateIncidentImpact } from '../impact/service.js';
import { INCIDENT_STATUSES } from './types.js';

const assignment=z.object({assigneeUserId:z.string().uuid().optional(),teamId:z.string().uuid().optional(),dueAt:z.string().datetime().optional()}).refine(x=>x.assigneeUserId||x.teamId,{message:'assigneeUserId or teamId required'});
const status=z.object({status:z.enum(INCIDENT_STATUSES),note:z.string().max(1000).optional()});
export async function incidentRoutes(app:FastifyInstance){
  app.get('/incidents/queue',{preHandler:requireRole('officer','supervisor','administrator')},async(req:any)=>listIncidentQueue({departmentId:req.query?.departmentId,wardId:req.query?.wardId,status:req.query?.status}));
  app.get('/incidents/history',{preHandler:requireRole('supervisor','administrator')},async()=>listResolvedIncidentHistory());
  app.get('/incidents/:id',{preHandler:requireRole('officer','supervisor','administrator')},async(req:any,reply)=>{const x=await getIncident(req.params.id);return x?x:reply.code(404).send({error:'INCIDENT_NOT_FOUND'});});
  app.post('/incidents/:id/acknowledge',{preHandler:requireRole('officer','supervisor','administrator')},async(req:any)=>acknowledgeIncident(req.params.id,req.user.id));
  app.patch('/incidents/:id/status',{preHandler:requireRole('officer','supervisor','administrator')},async(req:any,reply)=>{try{const input=status.parse(req.body);if(req.user.role==='officer'&&(input.status==='resolved'||input.status==='closed'))return reply.code(403).send({error:'RESOLUTION_REQUIRES_VERIFICATION'});return await updateIncidentStatus(req.params.id,req.user.id,input.status,input.note);}catch(e:any){if(e.message?.startsWith('INVALID_INCIDENT_STATUS'))return reply.code(409).send({error:'INVALID_INCIDENT_STATUS_TRANSITION'});if(e.message==='CROSS_DEPARTMENT_TASKS_INCOMPLETE'||e.message==='RESOLUTION_REQUIRES_CITIZEN_CONFIRMATION')return reply.code(409).send({error:e.message});throw e;}});
  app.post('/incidents/:id/assign',{preHandler:requireRole('supervisor','administrator')},async(req:any,reply)=>{const x=assignment.parse(req.body);const {rows}=await db.query(`INSERT INTO assignments(incident_id,team_id,assignee_user_id,assigned_by_user_id,due_at) VALUES($1,$2,$3,$4,$5) RETURNING id,status,assigned_at AS "assignedAt",due_at AS "dueAt",assignee_user_id AS "assigneeUserId",team_id AS "teamId"`,[req.params.id,x.teamId??null,x.assigneeUserId??null,req.user.id,x.dueAt??null]);await db.query(`UPDATE incidents SET status='assigned',assigned_team_id=COALESCE($2,assigned_team_id),updated_at=now() WHERE id=$1`,[req.params.id,x.teamId??null]);await db.query(`INSERT INTO incident_history(incident_id,actor_user_id,event_type,details) VALUES($1,$2,'ASSIGNED',$3)`,[req.params.id,req.user.id,JSON.stringify(x)]);await calculateIncidentImpact(req.params.id);return reply.code(201).send(rows[0]);});
  app.get('/officers/me/incidents',{preHandler:requireRole('officer')},async(req:any)=>{const {rows}=await db.query(`SELECT DISTINCT i.id AS "incidentId",i.category_id AS "categoryId",i.status,a.status AS "assignmentStatus",a.assigned_at AS "assignedAt",a.due_at AS "dueAt",COALESCE((SELECT score FROM incident_impact_scores s WHERE s.incident_id=i.id ORDER BY calculated_at DESC LIMIT 1),0) AS "impactScore" FROM assignments a JOIN incidents i ON i.id=a.incident_id WHERE a.assignee_user_id=$1 AND a.status NOT IN ('completed','cancelled') ORDER BY "impactScore" DESC,a.assigned_at`,[req.user.id]);return rows;});
}
