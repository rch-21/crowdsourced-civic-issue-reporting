import type { FastifyInstance } from 'fastify';
import { requireRole } from '../auth/middleware.js';
import { calculateIncidentImpact, getWeights, savePopulationEstimate } from './service.js';
import { db } from '../lib/database.js';

export async function impactRoutes(app:FastifyInstance){
  app.get('/incidents/impact/ranked',{preHandler:requireRole('supervisor','administrator','officer')},async()=>{ const {rows}=await db.query(`SELECT DISTINCT ON (s.incident_id) s.incident_id AS "incidentId",s.score,s.priority,s.confidence,s.factors,s.calculation_version AS "version",s.calculated_at AS "calculatedAt" FROM incident_impact_scores s ORDER BY s.incident_id,s.calculated_at DESC`); return rows.sort((a: any,b: any)=>Number(b.score)-Number(a.score)); });
  app.get('/incidents/:id/impact',{preHandler:requireRole('supervisor','administrator','officer')},async(req:any)=>calculateIncidentImpact(req.params.id));
  app.get('/impact/config',{preHandler:requireRole('supervisor','administrator')},async()=>getWeights());
  app.post('/incidents/:id/population-estimate',{preHandler:requireRole('supervisor','administrator')},async(req:any)=>savePopulationEstimate(req.params.id,req.body??{}));
  app.get('/incidents/:id/population-estimate',{preHandler:requireRole('supervisor','administrator','officer')},async(req:any)=>{ const {rows}=await db.query(`SELECT estimated_population AS "estimatedPopulation",confidence,"contributing_factors" AS "contributingFactors",calculation_version AS "version",calculated_at AS "calculatedAt" FROM incident_population_estimates WHERE incident_id=$1 ORDER BY calculated_at DESC LIMIT 1`,[req.params.id]); return rows[0]??null; });
}
