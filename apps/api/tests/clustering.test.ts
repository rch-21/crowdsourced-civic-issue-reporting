import { describe, expect, it } from 'vitest';
import { categoryScore, combineSignals, proximityScore, temporalScore, textSimilarity } from '../src/clustering/similarity.js';

describe('clustering similarity signals',()=>{
  it('scores geographic proximity and temporal proximity',()=>{
    expect(proximityScore(0,150)).toBe(1);
    expect(proximityScore(150,150)).toBe(0);
    expect(temporalScore(0,72)).toBe(1);
    expect(temporalScore(72,72)).toBe(0);
  });
  it('requires matching categories when category signal is used',()=>{
    expect(categoryScore('road','road')).toBe(1);
    expect(categoryScore('road','water')).toBe(0);
  });
  it('uses explainable text overlap rather than a single signal',()=>{
    expect(textSimilarity('large pothole on main road','pothole on main road')).toBeGreaterThan(0.4);
    const result=combineSignals({geographicScore:1,categoryScore:1,descriptionScore:0.8,imageScore:0,temporalScore:1});
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.explanation).toHaveProperty('weights');
  });
});
