export type Priority = 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
export interface ImpactWeights { severity:number;safety:number;population:number;location:number;duration:number;recurrence:number;confirmation:number;support:number; }
export interface ImpactFeatures { severity:number;safetyRisk:number;affectedPopulation:number;locationImportance:number;durationDays:number;recurrence:number;confirmations:number;supportVolume:number;populationConfidence:number; }
export interface ImpactResult { score:number; priority:Priority; confidence:number; factors:Record<string,number>; version:string; }
