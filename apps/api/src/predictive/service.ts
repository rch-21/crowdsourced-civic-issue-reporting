import {db} from '../lib/database.js';
import {calculatePrediction} from './types.js';

export async function getPredictiveConfig(){return (await db.query(`SELECT minimum_history "minimumHistory",window_days "windowDays",recurrence_weight "recurrenceWeight",recency_weight "recencyWeight",severity_weight "severityWeight",history_weight "historyWeight",seasonal_weight "seasonalWeight",intervention_weight "interventionWeight",minimum_confidence "minimumConfidence" FROM predictive_maintenance_config WHERE id=true`)).rows[0];}

export async function predictInfrastructure(infrastructureId:string){
 const config=await getPredictiveConfig();
 const {rows}=await db.query(`SELECT i.id,i.category_id "categoryId",c.name category,i.created_at "occurredAt",i.severity_score severity,i.status FROM infrastructure_incidents x JOIN incidents i ON i.id=x.incident_id JOIN issue_categories c ON c.id=i.category_id WHERE x.infrastructure_id=$1 ORDER BY i.created_at`,[infrastructureId]);
 const result=calculatePrediction(rows,config);const {rows:saved}=await db.query(`INSERT INTO predictive_maintenance_predictions(infrastructure_id,predicted_issue_category,risk_score,risk_category,confidence,contributing_factors,evidence,model_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id AS "predictionId",prediction_at "predictionAt"`,[infrastructureId,result.predictedIssueCategory,result.riskScore,result.riskCategory,result.confidence,JSON.stringify(result.factors),JSON.stringify(result.evidence),result.version]);
 return {...result,...saved[0],predictedIssueCategoryName:rows.find((r:any)=>r.categoryId===result.predictedIssueCategory)?.category??null};
}

export async function maintenanceQueue(){
 const {rows}=await db.query(`SELECT p.id AS "predictionId",p.infrastructure_id "infrastructureId",ip.name "locationName",ip.infrastructure_type "infrastructureType",p.predicted_issue_category "predictedIssueCategory",c.name "predictedIssueCategoryName",p.risk_score "riskScore",p.risk_category "riskCategory",p.confidence,p.contributing_factors "contributingFactors",p.evidence,p.prediction_at "predictionAt" FROM predictive_maintenance_predictions p LEFT JOIN infrastructure_profiles ip ON ip.id=p.infrastructure_id LEFT JOIN issue_categories c ON c.id=p.predicted_issue_category WHERE p.prediction_at=(SELECT MAX(p2.prediction_at) FROM predictive_maintenance_predictions p2 WHERE p2.infrastructure_id=p.infrastructure_id) AND p.risk_category <> 'INSUFFICIENT_DATA' ORDER BY p.risk_score DESC,p.prediction_at DESC`);return rows;
}

export async function predictionDetail(id:string){
 const prediction=(await db.query(`SELECT p.id AS "predictionId",p.infrastructure_id "infrastructureId",p.predicted_issue_category "predictedIssueCategory",c.name "predictedIssueCategoryName",p.risk_score "riskScore",p.risk_category "riskCategory",p.confidence,p.contributing_factors "contributingFactors",p.evidence,p.model_version "modelVersion",p.prediction_at "predictionAt" FROM predictive_maintenance_predictions p LEFT JOIN issue_categories c ON c.id=p.predicted_issue_category WHERE p.id=$1`,[id])).rows[0];if(!prediction)return null;
 const incidents=(await db.query(`SELECT i.id,c.name category,i.status,i.created_at "occurredAt",i.severity_score severity FROM infrastructure_incidents x JOIN incidents i ON i.id=x.incident_id JOIN issue_categories c ON c.id=i.category_id WHERE x.infrastructure_id=$1 ORDER BY i.created_at DESC`,[prediction.infrastructureId])).rows;
 const feedback=(await db.query(`SELECT id,outcome,related_incident_id "relatedIncidentId",notes,recorded_at "recordedAt" FROM predictive_maintenance_feedback WHERE prediction_id=$1 ORDER BY recorded_at DESC`,[id])).rows;return {...prediction,incidents,feedback};
}

export async function recordFeedback(predictionId:string,userId:string,input:{outcome:string;relatedIncidentId?:string;notes?:string}){const {rows}=await db.query(`INSERT INTO predictive_maintenance_feedback(prediction_id,outcome,related_incident_id,notes,recorded_by_user_id) VALUES($1,$2,$3,$4,$5) RETURNING id,outcome,related_incident_id "relatedIncidentId",notes,recorded_at "recordedAt"`,[predictionId,input.outcome,input.relatedIncidentId??null,input.notes??null,userId]);return rows[0];}
