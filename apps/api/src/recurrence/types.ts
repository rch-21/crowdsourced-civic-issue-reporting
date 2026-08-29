export interface RecurrenceConfig {
  minimumOccurrences:number; windowMonths:number; radiusM:number; requireRelatedCategory:boolean;
}
export interface HistoricalIncident { id:string; categoryId:string; occurredAt:string; status:string; }
export interface RecurrenceResult {
  isRecurring:boolean; occurrenceCount:number; periodStart:string|null; periodEnd:string|null;
  lastOccurrenceAt:string|null; confidence:number; categoryId:string; evidence:Record<string,unknown>; version:string;
}

export function assessRecurrence(incidents:HistoricalIncident[],categoryId:string,now:Date,config:RecurrenceConfig):RecurrenceResult {
  const cutoff=new Date(now); cutoff.setMonth(cutoff.getMonth()-config.windowMonths);
  const related=incidents.filter(i=>i.categoryId===categoryId && new Date(i.occurredAt)>=cutoff && new Date(i.occurredAt)<=now).sort((a,b)=>+new Date(a.occurredAt)-+new Date(b.occurredAt));
  const dates=related.map(i=>new Date(i.occurredAt)); const recurring=related.length>=config.minimumOccurrences;
  const confidence=recurring?Math.min(1,0.55+(related.length-config.minimumOccurrences)*0.1):Math.min(0.5,related.length/config.minimumOccurrences*0.5);
  return {isRecurring:recurring,occurrenceCount:related.length,periodStart:dates[0]?.toISOString()??null,periodEnd:dates.at(-1)?.toISOString()??null,lastOccurrenceAt:dates.at(-1)?.toISOString()??null,confidence,evidence:{minimumOccurrences:config.minimumOccurrences,windowMonths:config.windowMonths,radiusM:config.radiusM,categoryMatched:true,interpretation:recurring?'Repeated issue at this location; evidence for investigation.':'Insufficient historical occurrences.'},categoryId,version:'recurrence-v1'};
}
