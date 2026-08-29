import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {requireRole} from '../auth/middleware.js';
import {detectInfrastructureHypothesis,getRootCauseConfig,hypothesisDetail,listHypotheses,reviewHypothesis} from './service.js';

const review=z.object({status:z.enum(['accepted','rejected','requires_investigation']),notes:z.string().max(4000).optional()});
export async function rootCauseRoutes(app:FastifyInstance){
 app.get('/root-cause/config',{preHandler:requireRole('supervisor','administrator')},getRootCauseConfig);
 app.get('/root-cause/hypotheses',{preHandler:requireRole('supervisor','administrator')},async(req:any)=>listHypotheses(req.query?.status));
 app.get('/root-cause/hypotheses/:id',{preHandler:requireRole('supervisor','administrator')},async(req:any,reply)=>{const x=await hypothesisDetail(req.params.id);return x??reply.code(404).send({error:'HYPOTHESIS_NOT_FOUND'});});
 app.post('/infrastructure/:id/root-cause-analysis',{preHandler:requireRole('supervisor','administrator')},async(req:any)=>detectInfrastructureHypothesis(req.params.id));
 app.patch('/root-cause/hypotheses/:id/review',{preHandler:requireRole('supervisor','administrator')},async(req:any)=>{const x=review.parse(req.body);return reviewHypothesis(req.params.id,req.user.id,x.status,x.notes);});
}
