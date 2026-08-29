export type RiskCategory='LOW'|'MEDIUM'|'HIGH'|'CRITICAL'|'INSUFFICIENT_DATA';
export interface PredictiveConfig{minimumHistory:number;windowDays:number;recurrenceWeight:number;recencyWeight:number;severityWeight:number;historyWeight:number;seasonalWeight:number;interventionWeight:number;minimumConfidence:number;}
export interface HistoricalIncident{id:string;categoryId:string;category:string;occurredAt:string;severity?:number|null;status:string;}
export interface PredictionResult{riskScore:number|null;riskCategory:RiskCategory;confidence:number;predictedIssueCategory:string|null;incidentIds:string[];factors:Record<string,number|null>;evidence:Record<string,unknown>;version:string;}

export function calculatePrediction(incidents:HistoricalIncident[],config:PredictiveConfig,now=new Date()):PredictionResult{
 const cutoff=now.getTime()-config.windowDays*86400000;
 const recent=incidents.filter(i=>Date.parse(i.occurredAt)>=cutoff&&Date.parse(i.occurredAt)<=now.getTime());
 if(recent.length<config.minimumHistory)return {riskScore:null,riskCategory:'INSUFFICIENT_DATA',confidence:0,predictedIssueCategory:null,incidentIds:recent.map(i=>i.id),factors:{},evidence:{requiredHistory:config.minimumHistory,availableHistory:recent.length,windowDays:config.windowDays},version:'predictive-maintenance-v1'};
 const counts=new Map<string,HistoricalIncident[]>(); for(const i of recent)counts.set(i.categoryId,[...(counts.get(i.categoryId)??[]),i]);
 const ranked=[...counts.entries()].sort((a,b)=>b[1].length-a[1].length);const [categoryId,catIncidents]=ranked[0];
 const recurrence=Math.min(1,catIncidents.length/(config.minimumHistory*2));
 const newest=Math.max(...catIncidents.map(i=>Date.parse(i.occurredAt)));const ageDays=Math.max(0,(now.getTime()-newest)/86400000);const recency=Math.max(0,1-ageDays/config.windowDays);
 const severity=catIncidents.reduce((s,i)=>s+(Number(i.severity) || 0),0)/catIncidents.length/100;
 const history=Math.min(1,recent.length/(config.minimumHistory*4));
 const months=new Set(catIncidents.map(i=>new Date(i.occurredAt).getUTCMonth())).size;const seasonal=months<=3?0.75:0.25;
 const interventionCount=catIncidents.filter(i=>['resolved','closed'].includes(i.status)).length;const interventionSignal=interventionCount?Math.max(0,Math.min(1,catIncidents.length-interventionCount)/catIncidents.length):0.5;
 const score=Math.round(Math.min(100,100*(recurrence*config.recurrenceWeight+recency*config.recencyWeight+severity*config.severityWeight+history*config.historyWeight+seasonal*config.seasonalWeight+interventionSignal*config.interventionWeight)) * 100)/100;
 const confidence=Math.min(1,0.45+Math.min(.3,(recent.length-config.minimumHistory)*.05)+Math.min(.2,catIncidents.length*.04));
 const riskCategory=confidence<config.minimumConfidence?'INSUFFICIENT_DATA':score>=85?'CRITICAL':score>=65?'HIGH':score>=40?'MEDIUM':'LOW';
 return {riskScore:score,riskCategory,confidence,predictedIssueCategory:categoryId,incidentIds:catIncidents.map(i=>i.id),factors:{recurrence,recency,severity,historicalFrequency:history,seasonality:seasonal,interventionRisk:interventionSignal},evidence:{observedIncidentCount:recent.length,issueOccurrences:catIncidents.length,windowDays:config.windowDays,latestOccurrence:new Date(newest).toISOString(),observedStatuses:[...new Set(catIncidents.map(i=>i.status))],note:'Historical observations are separate from model inference. Elevated risk is not a certainty.'},version:'predictive-maintenance-v1'};
}
