import {db} from '../lib/database.js';
import {randomUUID} from 'node:crypto';
import {findCandidates} from '../clustering/service.js';
import {calculateIncidentImpact} from '../impact/service.js';
import type {ReportWorkStatus} from './types.js';
export async function createReport(input:{citizenId:string;categoryId:string;description:string;latitude:number;longitude:number;address?:string;wardId?:string;departmentId?:string}){
 const id=randomUUID(),incidentId=randomUUID();await db.query('BEGIN');
 try{await db.query(`INSERT INTO incidents(id,category_id,department_id,ward_id,location,status) VALUES($1,$2,$3,$4,ST_SetSRID(ST_MakePoint($5,$6),4326),'open')`,[incidentId,input.categoryId,input.departmentId??null,input.wardId??null,input.longitude,input.latitude]);
 await db.query(`INSERT INTO reports(id,citizen_id,category_id,incident_id,department_id,ward_id,description,location,address,work_status) VALUES($1,$2,$3,$4,$5,$6,$7,ST_SetSRID(ST_MakePoint($8,$9),4326),$10,'REPORTED')`,[id,input.citizenId,input.categoryId,incidentId,input.departmentId??null,input.wardId??null,input.description,input.longitude,input.latitude,input.address??null]);
 await db.query(`INSERT INTO report_status_history(report_id,actor_user_id,to_status) VALUES($1,$2,'REPORTED')`,[id,input.citizenId]);await db.query('COMMIT');
 const candidates=await findCandidates(id);const best=candidates.filter(x=>x.decision==='associated').sort((a,b)=>b.signals.confidence-a.signals.confidence)[0];
 if(best){await db.query('BEGIN');try{await db.query(`UPDATE reports SET incident_id=$1 WHERE id=$2`,[best.incidentId,id]);await db.query(`INSERT INTO incident_associations(report_id,incident_id,confidence,geographic_score,category_score,description_score,image_score,temporal_score,decision,explanation) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'associated',$9)`,[id,best.incidentId,best.signals.confidence,best.signals.geographicScore,best.signals.categoryScore,best.signals.descriptionScore,best.signals.imageScore,best.signals.temporalScore,JSON.stringify({...best.signals,reason:'same category plus geographic, temporal and description similarity'})]);await db.query(`DELETE FROM incidents WHERE id=$1 AND NOT EXISTS(SELECT 1 FROM reports WHERE incident_id=$1)`,[incidentId]);await db.query('COMMIT');await calculateIncidentImpact(best.incidentId);return {id,incidentId:best.incidentId,clustered:true,clusterConfidence:best.signals.confidence};}catch(e){await db.query('ROLLBACK');throw e}}
 await calculateIncidentImpact(incidentId);
 return {id,incidentId,clustered:false};
 }catch(e){await db.query('ROLLBACK');throw e}
}
export async function getReport(id:string){
 const {rows}=await db.query(`SELECT r.id,r.citizen_id AS "citizenId",r.category_id AS "categoryId",r.description,ST_Y(r.location) latitude,ST_X(r.location) longitude,r.address,r.work_status AS "workStatus",r.ward_id AS "wardId",r.department_id AS "departmentId",r.incident_id AS "incidentId",r.reported_at AS "reportedAt" FROM reports r WHERE r.id=$1`,[id]);
 const report=rows[0]; if(!report) return null;
 const comments=(await db.query(`SELECT id,body,created_at AS "createdAt" FROM report_comments WHERE report_id=$1 ORDER BY created_at`,[id])).rows;
 const feedback=(await db.query(`SELECT rating,body,created_at AS "createdAt" FROM report_feedback WHERE report_id=$1 ORDER BY created_at DESC`,[id])).rows;
 return {...report, comments, feedback};
}
export async function listReports(citizenId:string){const {rows}=await db.query(`SELECT r.id,r.category_id AS "categoryId",r.description,r.work_status AS "workStatus",r.reported_at AS "reportedAt",r.incident_id AS "incidentId",r.address FROM reports r WHERE r.citizen_id=$1 ORDER BY r.reported_at DESC`,[citizenId]);return rows}
