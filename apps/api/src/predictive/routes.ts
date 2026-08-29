import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {requireRole} from '../auth/middleware.js';
import {getPredictiveConfig,maintenanceQueue,predictInfrastructure,predictionDetail,recordFeedback} from './service.js';
const feedback=z.object({outcome:z.enum(['actual_incident','no_incident','preventive_intervention','unknown']),relatedIncidentId:z.string().uuid().optional(),notes:z.string().max(4000).optional()});
export async function predictiveRoutes(app:FastifyInstance){
 app.get('/predictive-maintenance/config',{preHandler:requireRole('supervisor','administrator')},getPredictiveConfig);
 app.get('/predictive-maintenance/queue',{preHandler:requireRole('supervisor','administrator')},maintenanceQueue);
 app.get('/predictive-maintenance/predictions/:id',{preHandler:requireRole('supervisor','administrator')},async(req:any,reply)=>{const x=await predictionDetail(req.params.id);return x??reply.code(404).send({error:'PREDICTION_NOT_FOUND'});});
 app.post('/infrastructure/:id/predictive-maintenance',{preHandler:requireRole('supervisor','administrator')},async(req:any)=>predictInfrastructure(req.params.id));
 app.post('/predictive-maintenance/predictions/:id/feedback',{preHandler:requireRole('supervisor','administrator')},async(req:any)=>recordFeedback(req.params.id,req.user.id,feedback.parse(req.body)));
}
