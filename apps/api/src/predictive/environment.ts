/** External environmental data adapter contract. Phase 10 provides no fake provider. */
export interface EnvironmentalObservation{observedAt:string;rainfallMm?:number;temperatureC?:number;source:string;confidence:number;}
export interface EnvironmentalDataProvider{getObservations(location:{latitude:number;longitude:number},from:Date,to:Date):Promise<EnvironmentalObservation[]>;}
export class UnavailableEnvironmentalDataProvider implements EnvironmentalDataProvider{async getObservations(){return [] as EnvironmentalObservation[];}}
