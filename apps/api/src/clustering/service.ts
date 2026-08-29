import { db } from '../lib/database.js';
import { combineSignals, proximityScore, temporalScore, categoryScore, textSimilarity } from './similarity.js';
import type { ClusterCandidate, ClusterThresholds } from './types.js';

export async function thresholds(): Promise<ClusterThresholds> {
  const { rows }=await db.query(`SELECT geographic_threshold_m AS "geographicThresholdM",temporal_window_hours AS "temporalWindowHours",category_match_required AS "categoryMatchRequired",description_similarity_threshold AS "descriptionSimilarityThreshold",image_similarity_threshold AS "imageSimilarityThreshold",confidence_threshold AS "confidenceThreshold" FROM clustering_config WHERE id=true`);
  return rows[0];
}

export async function findCandidates(reportId:string):Promise<ClusterCandidate[]> {
  const t=await thresholds();
  const { rows }=await db.query(`SELECT r.id AS "reportId",r.category_id AS "categoryId",r.description,r.reported_at AS "reportedAt",i.id AS "incidentId",i.category_id AS "incidentCategoryId",i.created_at AS "incidentCreatedAt",ST_Distance(r.location::geography,i.location::geography) AS "distanceM" FROM reports r JOIN incidents i ON i.id=r.incident_id WHERE r.id=$1`,[reportId]);
  const source=rows[0]; if(!source) return [];
  const nearby=await db.query(`SELECT DISTINCT ON (i.id) i.id AS "incidentId",i.category_id AS "incidentCategoryId",i.created_at AS "incidentCreatedAt",ST_Distance(r.location::geography,i.location::geography) AS "distanceM",r.description,r.reported_at AS "reportedAt" FROM incidents i JOIN reports r ON r.incident_id=i.id WHERE i.id<>$2 AND ST_DWithin(r.location::geography,(SELECT location::geography FROM reports WHERE id=$1),$3) AND r.reported_at BETWEEN (SELECT reported_at FROM reports WHERE id=$1)-make_interval(hours=>$4) AND (SELECT reported_at FROM reports WHERE id=$1)+make_interval(hours=>$4)`,[reportId,source.incidentId,t.geographicThresholdM,t.temporalWindowHours]);
  return nearby.rows.map((c:any)=>{
    const gs=proximityScore(Number(c.distanceM),t.geographicThresholdM), cs=categoryScore(source.categoryId,c.incidentCategoryId), ds=textSimilarity(source.description,c.description), ts=temporalScore(Math.abs(new Date(source.reportedAt).getTime()-new Date(c.reportedAt).getTime())/3600000,t.temporalWindowHours), is=0;
    const combined=combineSignals({geographicScore:gs,categoryScore:cs,descriptionScore:ds,imageScore:is,temporalScore:ts});
    const signals={...combined,geographicScore:gs,categoryScore:cs,descriptionScore:ds,imageScore:is,temporalScore:ts};
    const eligible=(!t.categoryMatchRequired||cs===1)&&combined.confidence>=t.confidenceThreshold;
    return {reportId,incidentId:c.incidentId,signals,decision:eligible?'associated':'suggested'};
  });
}
