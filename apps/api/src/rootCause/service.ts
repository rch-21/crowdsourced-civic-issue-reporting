import {db} from '../lib/database.js';
import {detectPattern} from './types.js';

export async function getRootCauseConfig(){return (await db.query(`SELECT radius_m "radiusM",window_days "windowDays",minimum_distinct_categories "minimumDistinctCategories",minimum_incidents "minimumIncidents",minimum_confidence "minimumConfidence" FROM root_cause_config WHERE id=true`)).rows[0];}

export async function detectInfrastructureHypothesis(infrastructureId:string){
 const config=await getRootCauseConfig();
 const {rows}=await db.query(`SELECT i.id,c.name category,i.category_id "categoryId",i.created_at "occurredAt",ST_Y(i.location) latitude,ST_X(i.location) longitude,i.severity_score severity,x.infrastructure_id "infrastructureId" FROM infrastructure_incidents x JOIN incidents i ON i.id=x.incident_id JOIN issue_categories c ON c.id=i.category_id WHERE x.infrastructure_id=$1 ORDER BY i.created_at`,[infrastructureId]);
 const result=detectPattern(rows,config); if(!result.shouldCreate)return result;
 const {rows:h}=await db.query(`INSERT INTO root_cause_hypotheses(infrastructure_id,location,suspected_cause_category,confidence,supporting_evidence,detection_method) SELECT $1,p.location,$2,$3,$4,$5 FROM infrastructure_profiles p WHERE p.id=$1 RETURNING id`,[infrastructureId,result.suspectedCauseCategory,result.confidence,JSON.stringify(result.evidence),result.detectionMethod]);
 if(h[0])await db.query(`INSERT INTO root_cause_hypothesis_incidents(hypothesis_id,incident_id,relationship) SELECT $1,unnest($2::uuid[]),'supporting'`,[h[0].id,result.incidentIds]);
 return {...result,hypothesisId:h[0]?.id??null};
}

export async function listHypotheses(status?:string){
 const values:any[]=[];const where=status?(values.push(status),'WHERE h.review_status=$1'):'';
 const {rows}=await db.query(`SELECT h.id AS "hypothesisId",h.suspected_cause_category "suspectedCauseCategory",h.confidence,h.supporting_evidence "supportingEvidence",h.detection_method "detectionMethod",h.review_status "reviewStatus",h.review_notes "reviewNotes",h.created_at "createdAt",h.reviewed_at "reviewedAt",h.infrastructure_id "infrastructureId",COUNT(hi.incident_id)::int "incidentCount" FROM root_cause_hypotheses h LEFT JOIN root_cause_hypothesis_incidents hi ON hi.hypothesis_id=h.id ${where} GROUP BY h.id ORDER BY h.created_at DESC`,values);return rows;
}

export async function hypothesisDetail(id:string){
 const h=(await db.query(`SELECT id AS "hypothesisId",infrastructure_id "infrastructureId",suspected_cause_category "suspectedCauseCategory",confidence,supporting_evidence "supportingEvidence",detection_method "detectionMethod",review_status "reviewStatus",review_notes "reviewNotes",created_at "createdAt",reviewed_at "reviewedAt" FROM root_cause_hypotheses WHERE id=$1`,[id])).rows[0];if(!h)return null;
 const incidents=(await db.query(`SELECT i.id,c.name category,i.status,i.created_at "occurredAt",i.severity_score severity,hi.relationship FROM root_cause_hypothesis_incidents hi JOIN incidents i ON i.id=hi.incident_id JOIN issue_categories c ON c.id=i.category_id WHERE hi.hypothesis_id=$1 ORDER BY i.created_at`,[id])).rows;
 return {...h,incidents};
}

export async function reviewHypothesis(id:string,userId:string,status:'accepted'|'rejected'|'requires_investigation',notes?:string){
 const {rows}=await db.query(`UPDATE root_cause_hypotheses SET review_status=$1,review_notes=$2,reviewed_by_user_id=$3,reviewed_at=now() WHERE id=$4 RETURNING id AS "hypothesisId",review_status "reviewStatus",review_notes "reviewNotes",reviewed_at "reviewedAt"`,[status,notes??null,userId,id]);if(!rows[0])throw new Error('HYPOTHESIS_NOT_FOUND');return rows[0];
}
