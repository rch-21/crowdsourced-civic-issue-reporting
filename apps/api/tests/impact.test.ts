import { describe,expect,it } from 'vitest';
import { calculateImpact,priorityFor } from '../src/impact/scoring.js';
const w={severity:.18,safety:.22,population:.18,location:.14,duration:.10,recurrence:.06,confirmation:.06,support:.06};

describe('civic impact scoring',()=>{
  it('classifies score bands',()=>{expect(priorityFor(20)).toBe('LOW');expect(priorityFor(50)).toBe('MEDIUM');expect(priorityFor(70)).toBe('HIGH');expect(priorityFor(90)).toBe('CRITICAL');});
  it('produces every configured priority from the complete feature set',()=>{
    const scenarios=[
      ['LOW',{severity:.05,safetyRisk:.05,affectedPopulation:0,durationDays:0,locationImportance:.1,recurrence:0,confirmations:0,supportVolume:1,populationConfidence:.2}],
      ['MEDIUM',{severity:.5,safetyRisk:.5,affectedPopulation:1000,durationDays:15,locationImportance:.5,recurrence:.2,confirmations:3,supportVolume:5,populationConfidence:.5}],
      ['HIGH',{severity:.8,safetyRisk:.8,affectedPopulation:5000,durationDays:15,locationImportance:.8,recurrence:.4,confirmations:5,supportVolume:8,populationConfidence:.7}],
      ['CRITICAL',{severity:1,safetyRisk:1,affectedPopulation:100000,durationDays:60,locationImportance:1,recurrence:1,confirmations:100,supportVolume:100,populationConfidence:1}]
    ] as const;
    for(const [expected,features] of scenarios) expect(calculateImpact(features,w).priority).toBe(expected);
  });
  it('does not make complaint volume the sole driver',()=>{
    const low=calculateImpact({severity:.2,safetyRisk:.1,affectedPopulation:100,durationDays:2,locationImportance:.2,recurrence:0,confirmations:1,supportVolume:100,populationConfidence:.8},w);
    const safety=calculateImpact({severity:1,safetyRisk:1,affectedPopulation:5000,durationDays:2,locationImportance:1,recurrence:0,confirmations:5,supportVolume:5,populationConfidence:.8},w);
    expect(safety.score).toBeGreaterThan(low.score); expect(safety.priority).not.toBe('LOW');
  });
  it('returns explainable factor values and confidence',()=>{const r=calculateImpact({severity:.8,safetyRisk:.9,affectedPopulation:1000,durationDays:4,locationImportance:.7,recurrence:.4,confirmations:10,supportVolume:37,populationConfidence:.6},w);expect(r.factors).toHaveProperty('safety');expect(r.factors).toHaveProperty('population');expect(r.confidence).toBeGreaterThan(0);});
});
