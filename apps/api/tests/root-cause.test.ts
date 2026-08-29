import {describe,expect,it} from 'vitest';
import {detectPattern} from '../src/rootCause/types.js';
const config={radiusM:500,windowDays:365,minimumDistinctCategories:2,minimumIncidents:3,minimumConfidence:.55};
const d=(days:number)=>new Date(Date.now()-days*86400000).toISOString();
const at=(id:string,category:string,days:number,lat=17.72,lon=83.31,infrastructureId?:string)=>({id,category,occurredAt:d(days),latitude:lat,longitude:lon,infrastructureId});

describe('root-cause pattern detection',()=>{
 it('detects multiple issue types at one infrastructure',()=>{const r=detectPattern([at('1','Drain blockage',300,0,0,'a'),at('2','Waterlogging',180,0,0,'a'),at('3','Road damage',30,0,0,'a')],config);expect(r.shouldCreate).toBe(true);expect(r.suspectedCauseCategory).toContain('Drainage');});
 it('does not merge same category across unrelated locations',()=>{const r=detectPattern([at('1','Pothole',10,17.72,83.31,'a'),at('2','Pothole',20,17.80,83.40,'b'),at('3','Pothole',30,17.90,83.50,'c')],config);expect(r.shouldCreate).toBe(false);});
 it('recognizes temporal correlation without claiming causality',()=>{const r=detectPattern([at('1','Drain overflow',20,0,0,'a'),at('2','Waterlogging',18,0,0,'a'),at('3','Road damage',15,0,0,'a')],config);expect(r.evidence).toHaveProperty('temporalCorrelation',true);expect(String(r.evidence.note)).toContain('hypothesis');});
 it('rejects non-meaningful isolated patterns',()=>{const r=detectPattern([at('1','Garbage',5,0,0,'a')],config);expect(r.shouldCreate).toBe(false);});
 it('enforces the configured time window',()=>{const r=detectPattern([at('1','Drain',500,0,0,'a'),at('2','Waterlogging',400,0,0,'a'),at('3','Road damage',300,0,0,'a')],config);expect(r.shouldCreate).toBe(false);});
 it('detects nearby different infrastructure within the configured radius',()=>{const r=detectPattern([at('1','Drain overflow',10,17.7200,83.3100,'a'),at('2','Waterlogging',20,17.7210,83.3100,'b'),at('3','Road damage',30,17.7190,83.3100,'c')],config);expect(r.shouldCreate).toBe(true);expect(r.evidence.spatialCorrelation).toBe(true);});
 it('rejects different locations outside the configured radius',()=>{const r=detectPattern([at('1','Drain overflow',10,17.72,83.31,'a'),at('2','Waterlogging',20,17.73,83.31,'b'),at('3','Road damage',30,17.74,83.31,'c')],config);expect(r.shouldCreate).toBe(false);});
});
