import type { ImpactFeatures } from './types.js';
export interface PopulationEstimate { estimatedPopulation:number;confidence:number;contributingFactors:Record<string,unknown>;version:string; }
export function estimatePopulation(input:{populationDensity?:number; serviceAreaKm2?:number; nearbyFacilities?:number; roadClass?:'LOCAL'|'ARTERIAL'|'HIGHWAY'; footfall?:number}):PopulationEstimate {
  const hasDensity=input.populationDensity!==undefined&&input.serviceAreaKm2!==undefined;
  const base=hasDensity?Math.max(0,Math.round(input.populationDensity!*input.serviceAreaKm2!)):0;
  const facilities=Math.max(0,input.nearbyFacilities??0)*250;
  const roadFactor=input.roadClass==='HIGHWAY'?1.5:input.roadClass==='ARTERIAL'?1.25:1;
  const footfall=input.footfall??0;
  const estimated=Math.round((base+facilities+footfall)*roadFactor);
  const available=[hasDensity,input.nearbyFacilities!==undefined,input.roadClass!==undefined,input.footfall!==undefined].filter(Boolean).length;
  const confidence=Math.min(1,0.2+available*0.2);
  return {estimatedPopulation:estimated,confidence,version:'population-v1',contributingFactors:{populationDensity:input.populationDensity??null,serviceAreaKm2:input.serviceAreaKm2??null,nearbyFacilities:input.nearbyFacilities??null,roadClass:input.roadClass??null,footfall:input.footfall??null,estimateType:'ESTIMATE'}};
}
