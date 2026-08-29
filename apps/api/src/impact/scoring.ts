import type { ImpactFeatures, ImpactResult, ImpactWeights, Priority } from './types.js';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const populationNorm=(n:number)=>clamp(Math.log10(n+1)/5);
const durationNorm=(n:number)=>clamp(n/30);
const volumeNorm=(n:number)=>clamp(Math.log10(n+1)/2);
export function priorityFor(score:number):Priority { if(score>=85)return 'CRITICAL'; if(score>=65)return 'HIGH'; if(score>=40)return 'MEDIUM'; return 'LOW'; }
export function calculateImpact(f:ImpactFeatures,w:ImpactWeights,version='impact-v1'):ImpactResult {
  const factors={severity:clamp(f.severity),safety:clamp(f.safetyRisk),population:populationNorm(f.affectedPopulation),location:clamp(f.locationImportance),duration:durationNorm(f.durationDays),recurrence:clamp(f.recurrence),confirmation:volumeNorm(f.confirmations),support:volumeNorm(f.supportVolume)};
  const score=Math.round((factors.severity*w.severity+factors.safety*w.safety+factors.population*w.population+factors.location*w.location+factors.duration*w.duration+factors.recurrence*w.recurrence+factors.confirmation*w.confirmation+factors.support*w.support)*10000)/100;
  const dataConfidence=0.35+0.65*clamp(f.populationConfidence);
  return {score,priority:priorityFor(score),confidence:Math.round(dataConfidence*100)/100,factors,version};
}
