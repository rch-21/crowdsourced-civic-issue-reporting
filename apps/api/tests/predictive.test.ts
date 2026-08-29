import {describe,expect,it} from 'vitest';
import {calculatePrediction} from '../src/predictive/types.js';
const cfg={minimumHistory:3,windowDays:730,recurrenceWeight:.3,recencyWeight:.2,severityWeight:.15,historyWeight:.15,seasonalWeight:.1,interventionWeight:.1,minimumConfidence:.55};
const d=(days:number)=>new Date(Date.now()-days*86400000).toISOString();
const incident=(n:number,days:number,severity=80,status='open',categoryId='pothole')=>({id:`i${n}`,categoryId,category:categoryId,occurredAt:d(days),severity,status});

describe('predictive maintenance model',()=>{
 it('flags a recurring high-risk location',()=>{const r=calculatePrediction([incident(1,10,90),incident(2,40,85),incident(3,100,88),incident(4,150,92)],cfg);expect(r.riskCategory).toBe('HIGH');expect(r.riskScore).toBeGreaterThan(65);});
 it('returns insufficient data for an isolated issue',()=>{const r=calculatePrediction([incident(1,10)],cfg);expect(r.riskCategory).toBe('INSUFFICIENT_DATA');expect(r.riskScore).toBeNull();});
 it('recognizes a concentrated seasonal pattern without external weather data',()=>{const r=calculatePrediction([incident(1,10),incident(2,40),incident(3,70),incident(4,100)],cfg);expect(r.factors.seasonality).toBeGreaterThan(0);expect(r.evidence).not.toHaveProperty('fabricatedRainfall');});
 it('can show declining frequency through lower recency/repeat signal',()=>{const recent=calculatePrediction([incident(1,500),incident(2,600),incident(3,700)],cfg);expect(recent.riskScore).toBeLessThan(65);});
 it('does not invent a prediction when history is insufficient',()=>{const r=calculatePrediction([incident(1,20),incident(2,50)],cfg);expect(r.riskCategory).toBe('INSUFFICIENT_DATA');});
});
