import { db } from '../lib/database.js';
import { calculateImpact } from './scoring.js';
import { estimatePopulation } from './population.js';
import type { ImpactFeatures, ImpactWeights } from './types.js';

export async function getWeights():Promise<{weights:ImpactWeights;version:string}> {
  const {rows}=await db.query(`SELECT severity_weight severity,safety_weight safety,population_weight population,location_weight location,duration_weight duration,recurrence_weight recurrence,confirmation_weight confirmation,support_weight support,version FROM impact_scoring_config WHERE id=true`);
  return {weights:rows[0],version:rows[0].version};
}

export async function calculateIncidentImpact(incidentId:string) {
  const {rows}=await db.query(`SELECT i.id,COALESCE(i.severity_score,sd.level*20,20)::numeric severity_score,COALESCE(pe.estimated_population,i.affected_population_estimate,0)::int affected_population,COALESCE(pe.confidence,CASE WHEN i.affected_population_estimate IS NULL THEN 0.2 ELSE 0.5 END)::numeric population_confidence,EXTRACT(EPOCH FROM (COALESCE(i.resolved_at,now())-i.created_at))/86400 duration_days,COUNT(DISTINCT r.id)::int support_volume,COUNT(DISTINCT c.id)::int+COUNT(DISTINCT vr.id) FILTER (WHERE vr.result='confirmed')::int confirmations,COALESCE(i.recurrence_count,0)::int recurrence_count,CASE WHEN i.ward_id IS NOT NULL THEN 0.75 ELSE 0.5 END location_importance FROM incidents i LEFT JOIN severity_definitions sd ON sd.id=i.severity_id LEFT JOIN reports r ON r.incident_id=i.id LEFT JOIN confirmations c ON c.incident_id=i.id LEFT JOIN verification_results vr ON vr.incident_id=i.id LEFT JOIN LATERAL (SELECT estimated_population,confidence FROM incident_population_estimates WHERE incident_id=i.id ORDER BY calculated_at DESC LIMIT 1) pe ON true WHERE i.id=$1 GROUP BY i.id,sd.level,pe.estimated_population,pe.confidence`,[incidentId]);
  if(!rows[0])throw new Error('INCIDENT_NOT_FOUND');
  const {weights,version}=await getWeights(); const x=rows[0];
  const severity=Math.max(0,Math.min(1,Number(x.severity_score)/100));
  const features:ImpactFeatures={severity,safetyRisk:severity,affectedPopulation:Number(x.affected_population),locationImportance:Number(x.location_importance),durationDays:Math.max(0,Number(x.duration_days)),recurrence:Math.max(0,Math.min(1,Number(x.recurrence_count)/5)),confirmations:Number(x.confirmations),supportVolume:Number(x.support_volume),populationConfidence:Number(x.population_confidence)};
  const result=calculateImpact(features,weights,version);
  await db.query(`INSERT INTO incident_impact_scores(incident_id,score,priority,factors,confidence,calculation_version) VALUES($1,$2,$3,$4,$5,$6)`,[incidentId,result.score,result.priority,JSON.stringify({...result.factors,affectedPopulation:features.affectedPopulation,supportVolume:features.supportVolume}),result.confidence,result.version]);
  await db.query(`UPDATE incidents SET impact_score=$1,updated_at=now() WHERE id=$2`,[result.score,incidentId]);
  return result;
}

export async function savePopulationEstimate(incidentId:string,input:Parameters<typeof estimatePopulation>[0]) { const result=estimatePopulation(input); await db.query(`INSERT INTO incident_population_estimates(incident_id,estimated_population,confidence,contributing_factors,calculation_version) VALUES($1,$2,$3,$4,$5)`,[incidentId,result.estimatedPopulation,result.confidence,JSON.stringify(result.contributingFactors),result.version]); await calculateIncidentImpact(incidentId); return result; }
