import {db} from '../lib/database.js';
import {assessRecurrence} from './types.js';

export async function getRecurrenceConfig(){const {rows}=await db.query(`SELECT minimum_occurrences "minimumOccurrences",window_months "windowMonths",radius_m "radiusM",require_related_category "requireRelatedCategory" FROM recurrence_config WHERE id=true`);return rows[0];}

export async function assessInfrastructure(infrastructureId:string,categoryId:string){
 const config=await getRecurrenceConfig();
 const {rows}=await db.query(`SELECT i.id,i.category_id "categoryId",COALESCE(i.resolved_at,i.created_at) "occurredAt",i.status FROM infrastructure_incidents x JOIN incidents i ON i.id=x.incident_id WHERE x.infrastructure_id=$1 AND i.category_id=$2 ORDER BY COALESCE(i.resolved_at,i.created_at)`,[infrastructureId,categoryId]);
 const result=assessRecurrence(rows,categoryId,new Date(),config);
 await db.query(`INSERT INTO recurrence_assessments(infrastructure_id,category_id,occurrence_count,period_start,period_end,last_occurrence_at,is_recurring,confidence,evidence,calculation_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[infrastructureId,categoryId,result.occurrenceCount,result.periodStart,result.periodEnd,result.lastOccurrenceAt,result.isRecurring,result.confidence,JSON.stringify(result.evidence),result.version]);
 return result;
}

export async function infrastructureHistory(id:string){
 const asset=(await db.query(`SELECT p.id,p.infrastructure_type "type",p.name,p.external_ref "externalRef",p.ward_id "wardId",p.responsible_department_id "responsibleDepartmentId",ST_AsGeoJSON(p.location)::json location FROM infrastructure_profiles p WHERE p.id=$1`,[id])).rows[0]; if(!asset)return null;
 const incidents=(await db.query(`SELECT i.id AS "incidentId",i.category_id "categoryId",i.status,i.created_at "createdAt",i.resolved_at "resolvedAt",x.relationship FROM infrastructure_incidents x JOIN incidents i ON i.id=x.incident_id WHERE x.infrastructure_id=$1 ORDER BY i.created_at`,[id])).rows;
 const interventions=(await db.query(`SELECT id,intervention_type "type",description,performed_at "performedAt",incident_id "incidentId" FROM infrastructure_interventions WHERE infrastructure_id=$1 ORDER BY performed_at`,[id])).rows;
 const recurrence=(await db.query(`SELECT category_id "categoryId",occurrence_count "occurrenceCount",period_start "periodStart",period_end "periodEnd",last_occurrence_at "lastOccurrenceAt",is_recurring "isRecurring",confidence,evidence,calculation_version "version",calculated_at "calculatedAt" FROM recurrence_assessments WHERE infrastructure_id=$1 ORDER BY calculated_at DESC`,[id])).rows;
 return {...asset,incidents,interventions,recurrence};
}
