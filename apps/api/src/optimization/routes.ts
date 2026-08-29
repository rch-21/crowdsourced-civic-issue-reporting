import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {db} from '../lib/database.js';
import {requireRole} from '../auth/middleware.js';
import {recommend} from './service.js';
const recommendationInput=z.object({incident:z.object({id:z.string().uuid(),latitude:z.number(),longitude:z.number(),impactScore:z.number().min(0).max(100),severity:z.number().min(0).max(100),slaDueAt:z.string().datetime().nullable().optional(),estimatedWorkMinutes:z.number().positive(),requiredSkills:z.array(z.string()),departmentId:z.string().uuid().nullable().optional()}),workers:z.array(z.object({userId:z.string().uuid(),departmentId:z.string().uuid().nullable().optional(),latitude:z.number(),longitude:z.number(),skills:z.array(z.string()),available:z.boolean(),activeWork:z.number().int().nonnegative(),maxConcurrent:z.number().int().positive(),estimatedWorkMinutes:z.number().positive()})).optional()});
const decision=z.object({decision:z.enum(['ACCEPT','MODIFY','REJECT','MANUAL_ASSIGN']),selectedWorkerUserId:z.string().uuid().nullable().optional(),note:z.string().max(2000).optional()});
export async function optimizationRoutes(app:FastifyInstance){
 app.get('/optimization/workers',{preHandler:requireRole('supervisor','administrator')},async()=>{
  const {rows}=await db.query(`SELECT wp.user_id AS "userId", u.display_name AS "displayName", wp.department_id AS "departmentId",
    ST_Y(wp.current_location) AS latitude, ST_X(wp.current_location) AS longitude,
    wp.availability_status AS "availabilityStatus", wp.max_concurrent_incidents AS "maxConcurrent",
    wp.estimated_work_minutes AS "estimatedWorkMinutes",
    COALESCE((SELECT array_agg(skill_code) FROM worker_skills ws WHERE ws.user_id=wp.user_id),'{}') AS skills,
    (SELECT count(*)::int FROM assignments a WHERE a.assignee_user_id=wp.user_id AND a.status NOT IN ('completed','cancelled')) AS "activeWork"
    FROM worker_profiles wp JOIN users u ON u.id=wp.user_id ORDER BY u.display_name`);
  return rows;
 });
 app.post('/optimization/recommendations',{preHandler:requireRole('supervisor','administrator')},async(req:any,reply)=>{
  const parsed=recommendationInput.parse(req.body);
  let workers=parsed.workers??[];
  if(!workers.length){
   const {rows}=await db.query(`SELECT wp.user_id AS "userId", wp.department_id AS "departmentId",
     ST_Y(wp.current_location) AS latitude, ST_X(wp.current_location) AS longitude,
     wp.availability_status AS availability, wp.max_concurrent_incidents AS "maxConcurrent",
     wp.estimated_work_minutes AS "estimatedWorkMinutes",
     COALESCE((SELECT array_agg(skill_code) FROM worker_skills ws WHERE ws.user_id=wp.user_id),'{}') AS skills,
     (SELECT count(*)::int FROM assignments a WHERE a.assignee_user_id=wp.user_id AND a.status NOT IN ('completed','cancelled')) AS "activeWork"
     FROM worker_profiles wp WHERE wp.current_location IS NOT NULL`);
   workers=rows.map((w:any)=>({userId:w.userId,departmentId:w.departmentId,latitude:Number(w.latitude),longitude:Number(w.longitude),skills:w.skills??[],available:w.availability==='AVAILABLE',activeWork:Number(w.activeWork??0),maxConcurrent:Number(w.maxConcurrent),estimatedWorkMinutes:Number(w.estimatedWorkMinutes)}));
  }
  const recommendations=recommend(parsed.incident,workers);
  if(!recommendations.length)return {recommendations:[],message:'No eligible available worker',decisionRequired:true};
  for(const r of recommendations)await db.query(`INSERT INTO assignment_recommendations(incident_id,worker_user_id,rank,score,rationale,estimated_travel_km,estimated_completion_at,algorithm_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[parsed.incident.id,r.workerUserId,r.rank,r.score,JSON.stringify(r.rationale),r.estimatedTravelKm,r.estimatedCompletionAt,'resource-optimization-v1']);
  return reply.code(201).send({recommendations,decisionRequired:true});
 });
 app.get('/optimization/recommendations/:incidentId',{preHandler:requireRole('supervisor','administrator')},async(req:any)=>{return (await db.query(`SELECT ar.*,u.display_name AS "workerName" FROM assignment_recommendations ar JOIN users u ON u.id=ar.worker_user_id WHERE ar.incident_id=$1 ORDER BY ar.rank`,[req.params.incidentId])).rows;});
 app.post('/optimization/recommendations/:id/decision',{preHandler:requireRole('supervisor','administrator')},async(req:any)=>{const x=decision.parse(req.body);await db.query(`INSERT INTO assignment_recommendation_decisions(recommendation_id,supervisor_user_id,decision,selected_worker_user_id,note) VALUES($1,$2,$3,$4,$5)`,[req.params.id,req.user.id,x.decision,x.selectedWorkerUserId??null,x.note??null]);return {recorded:true,decision:x.decision};});
}
