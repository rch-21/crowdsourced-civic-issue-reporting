import type {AnomalyConfig,AnomalyResult,ReportSignal} from './types.js';
export const DEFAULT_ANOMALY_CONFIG:AnomalyConfig={monitoringDays:30,radiusMeters:150,relatedWindowDays:30,minRelatedReports:2,highPriorityReports:3};
export function detectPostResolutionAnomaly(signals:ReportSignal[],resolvedAt:string,config=DEFAULT_ANOMALY_CONFIG):AnomalyResult|null{
 const t=Date.parse(resolvedAt); const eligible=signals.filter(r=>{const d=Date.parse(r.reportedAt)-t;return d>0&&d<=config.monitoringDays*86400000&&r.distanceMeters<=config.radiusMeters;});
 if(!eligible.length)return null;
 const related=eligible.filter(r=>r.imageSimilarity===undefined||r.imageSimilarity>=0.5);
 const reopened=eligible.filter(r=>r.reopened); const count=related.length;
 if(!reopened.length&&count<config.minRelatedReports)return null;
 const type=reopened.length?'POSSIBLE_REOCCURRENCE':count>=config.highPriorityReports?'POSSIBLE_FAILED_REPAIR':'RECURRING_AFTER_RESOLUTION';
 const confidence=Math.min(0.95,0.45+Math.min(0.3,count*0.1)+Math.min(0.2,reopened.length*0.2));
 return {type,confidence,reports:eligible,evidence:{resolvedAt,monitoringDays:config.monitoringDays,radiusMeters:config.radiusMeters,relatedReports:count,reopenedReports:reopened.length},priority:count>=config.highPriorityReports||reopened.length?'HIGH':'NORMAL'};
}
