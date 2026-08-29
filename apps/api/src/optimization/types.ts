export type OptimizationIncident={id:string;latitude:number;longitude:number;impactScore:number;severity:number;slaDueAt?:string|null;estimatedWorkMinutes:number;requiredSkills:string[];departmentId?:string|null};
export type Worker={userId:string;departmentId?:string|null;latitude:number;longitude:number;skills:string[];available:boolean;activeWork:number;maxConcurrent:number;estimatedWorkMinutes:number};
export type OptimizationWeights={impact:number;sla:number;distance:number;skill:number;workload:number};
export type Recommendation={workerUserId:string;score:number;rank:number;estimatedTravelKm:number;estimatedCompletionAt:string;rationale:Record<string,unknown>};
export const DEFAULT_WEIGHTS:OptimizationWeights={impact:.30,sla:.25,distance:.20,skill:.15,workload:.10};
