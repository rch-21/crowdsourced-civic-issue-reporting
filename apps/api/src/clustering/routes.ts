import type { FastifyInstance } from 'fastify';
import { requireRole } from '../auth/middleware.js';
import { findCandidates, thresholds } from './service.js';
import { db } from '../lib/database.js';

export async function clusteringRoutes(app:FastifyInstance){
  app.get('/clustering/reports/:id/candidates',{preHandler:requireRole('supervisor','administrator')},async(req:any)=>findCandidates(req.params.id));
  app.get('/clustering/config',{preHandler:requireRole('supervisor','administrator')},async()=>thresholds());
  app.get('/incidents/:id/cluster',{preHandler:requireRole('supervisor','administrator')},async(req:any)=>{
    const {rows}=await db.query(`SELECT ia.*,r.description,r.reported_at AS "reportedAt",r.citizen_id AS "citizenId" FROM incident_associations ia JOIN reports r ON r.id=ia.report_id WHERE ia.incident_id=$1 ORDER BY ia.created_at`,[req.params.id]);
    return rows;
  });
  app.post('/incidents/:incidentId/cluster-associations/:associationId/decision',{preHandler:requireRole('supervisor','administrator')},async(req:any,reply)=>{
    const decision=req.body?.decision; if(!['associated','unlinked','split'].includes(decision)) return reply.code(400).send({error:'INVALID_DECISION'});
    const {rows}=await db.query(`UPDATE incident_associations SET decision=$1,decided_at=now(),decided_by=$2 WHERE id=$3 AND incident_id=$4 RETURNING report_id`,[decision,req.user.id,req.params.associationId,req.params.incidentId]);
    if(!rows[0]) return reply.code(404).send({error:'ASSOCIATION_NOT_FOUND'});
    if(decision==='associated') await db.query(`UPDATE reports SET incident_id=$1 WHERE id=$2`,[req.params.incidentId,rows[0].report_id]);
    if(decision==='unlinked'||decision==='split') await db.query(`UPDATE reports SET incident_id=NULL WHERE id=$1`,[rows[0].report_id]);
    return {updated:true};
  });
}
