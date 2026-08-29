import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {requireRole} from '../auth/middleware.js';
import {db} from '../lib/database.js';
import {assessInfrastructure,getRecurrenceConfig,infrastructureHistory} from './service.js';

const profile=z.object({infrastructureType:z.string().min(1).max(100),name:z.string().max(200).optional(),externalRef:z.string().max(160).optional(),wardId:z.string().uuid().optional(),responsibleDepartmentId:z.string().uuid().optional(),latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180)});
const intervention=z.object({type:z.string().min(1).max(120),description:z.string().max(2000).optional(),performedAt:z.string().datetime(),incidentId:z.string().uuid().optional()});
export async function recurrenceRoutes(app:FastifyInstance){
 app.get('/infrastructure/:id/history',{preHandler:requireRole('officer','supervisor','administrator')},async(req:any,reply)=>{const x=await infrastructureHistory(req.params.id);return x??reply.code(404).send({error:'INFRASTRUCTURE_NOT_FOUND'});});
 app.get('/recurrence/config',{preHandler:requireRole('supervisor','administrator')},async()=>getRecurrenceConfig());
 app.post('/infrastructure/:id/recurrence/:categoryId',{preHandler:requireRole('supervisor','administrator')},async(req:any)=>assessInfrastructure(req.params.id,req.params.categoryId));
 app.post('/infrastructure/:id/incidents/:incidentId',{preHandler:requireRole('supervisor','administrator')},async(req:any,reply)=>{const {rows}=await db.query(`INSERT INTO infrastructure_incidents(infrastructure_id,incident_id,relationship) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING infrastructure_id AS "infrastructureId",incident_id AS "incidentId",relationship,linked_at AS "linkedAt"`,[req.params.id,req.params.incidentId,req.body?.relationship??'historical']);if(!rows[0])return reply.code(409).send({error:'INCIDENT_ALREADY_LINKED'});return reply.code(201).send(rows[0]);});
 app.post('/infrastructure',{preHandler:requireRole('supervisor','administrator')},async(req:any,reply)=>{const x=profile.parse(req.body);const {rows}=await db.query(`INSERT INTO infrastructure_profiles(infrastructure_type,name,external_ref,ward_id,responsible_department_id,location) VALUES($1,$2,$3,$4,$5,ST_SetSRID(ST_Point($6,$7),4326)) RETURNING id`,[x.infrastructureType,x.name??null,x.externalRef??null,x.wardId??null,x.responsibleDepartmentId??null,x.longitude,x.latitude]);return reply.code(201).send(rows[0]);});
 app.post('/infrastructure/:id/interventions',{preHandler:requireRole('supervisor','administrator')},async(req:any,reply)=>{const x=intervention.parse(req.body);const {rows}=await db.query(`INSERT INTO infrastructure_interventions(infrastructure_id,incident_id,performed_by_user_id,intervention_type,description,performed_at) VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,[req.params.id,x.incidentId??null,req.user.id,x.type,x.description??null,x.performedAt]);return reply.code(201).send(rows[0]);});
}
