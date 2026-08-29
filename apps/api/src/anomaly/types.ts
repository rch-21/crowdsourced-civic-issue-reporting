export type AnomalyType='RECURRING_AFTER_RESOLUTION'|'POSSIBLE_FAILED_REPAIR'|'POSSIBLE_REOCCURRENCE'|'INSUFFICIENT_EVIDENCE';
export type ReportSignal={reportId:string;reportedAt:string;categoryId:string;distanceMeters:number;reopened?:boolean;imageSimilarity?:number};
export type AnomalyConfig={monitoringDays:number;radiusMeters:number;relatedWindowDays:number;minRelatedReports:number;highPriorityReports:number};
export type AnomalyResult={type:AnomalyType;confidence:number;evidence:Record<string,unknown>;reports:ReportSignal[];priority:'NORMAL'|'HIGH'};
