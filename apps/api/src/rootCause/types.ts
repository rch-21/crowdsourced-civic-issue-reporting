export interface PatternIncident { id:string; category:string; categoryId?:string; occurredAt:string; infrastructureId?:string|null; latitude?:number|null; longitude?:number|null; severity?:number|null; }
export interface RootCauseConfig { radiusM:number; windowDays:number; minimumDistinctCategories:number; minimumIncidents:number; minimumConfidence:number; }
export interface HypothesisResult { shouldCreate:boolean; confidence:number; suspectedCauseCategory:string; incidentIds:string[]; evidence:Record<string,unknown>; detectionMethod:string; }

function distanceM(a:PatternIncident,b:PatternIncident){if(a.latitude==null||a.longitude==null||b.latitude==null||b.longitude==null)return Infinity;const r=6371000,rad=Math.PI/180;const p1=a.latitude*rad,p2=b.latitude*rad,dp=(b.latitude-a.latitude)*rad,dl=(b.longitude-a.longitude)*rad;const q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*r*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));}

export function detectPattern(incidents:PatternIncident[],config:RootCauseConfig,now=new Date()):HypothesisResult {
 const cutoff=now.getTime()-config.windowDays*86400000;
 const recent=incidents.filter(i=>Date.parse(i.occurredAt)>=cutoff&&Date.parse(i.occurredAt)<=now.getTime());
 const categories=[...new Set(recent.map(i=>i.category))];
 const assets=[...new Set(recent.map(i=>i.infrastructureId).filter(Boolean))];
 const sameAsset=assets.length===1&&recent.length>=config.minimumIncidents;
 const usableLocations=recent.every(i=>i.latitude!=null&&i.longitude!=null);
 const maxDistance=usableLocations&&recent.length>1?Math.max(...recent.flatMap((a,i)=>recent.slice(i+1).map(b=>distanceM(a,b)))):0;
 const nearby=usableLocations&&maxDistance<=config.radiusM;
 const enoughCategories=categories.length>=config.minimumDistinctCategories;
 const temporalSpread=recent.length>1?Math.min(1,(Math.max(...recent.map(i=>Date.parse(i.occurredAt)))-Math.min(...recent.map(i=>Date.parse(i.occurredAt))))/(config.windowDays*86400000)):0;
 const spatialMatch=sameAsset||nearby;
 const confidence=Math.min(1,0.45+Math.min(.25,Math.max(0,categories.length-config.minimumDistinctCategories)*.1)+(sameAsset?.2:nearby?.12:0)+Math.min(.1,recent.length*.02)+(temporalSpread>0?.05:0));
 const shouldCreate=recent.length>=config.minimumIncidents&&enoughCategories&&spatialMatch&&confidence>=config.minimumConfidence;
 const suspected=categories.some(c=>/drain|waterlog|flood|stormwater|overflow/i.test(c))?'Drainage / water-management issue':categories.length>1?'Shared infrastructure or environmental condition':'Cross-issue pattern';
 return {shouldCreate,confidence,suspectedCauseCategory:suspected,incidentIds:recent.map(i=>i.id),evidence:{observedIncidentCount:recent.length,observedCategories:categories,sharedInfrastructure:sameAsset,distinctInfrastructureCount:assets.length,windowDays:config.windowDays,radiusM:config.radiusM,maxObservedDistanceM:Math.round(maxDistance),usableLocations,spatialCorrelation:spatialMatch,temporalCorrelation:temporalSpread>0,note:'Observed data are distinct from model inference; this is a hypothesis for investigation.'},detectionMethod:'deterministic-cross-issue-v1'};
}
