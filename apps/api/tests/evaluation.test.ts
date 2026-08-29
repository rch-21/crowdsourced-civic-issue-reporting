import {describe,it,expect} from 'vitest';
import {classificationMetrics,monotonicScoreCheck} from '../src/evaluation/metrics.js';
import {syntheticEvaluationDataset} from './fixtures/intelligence-evaluation.js';
describe('Phase 18 intelligence evaluation',()=>{
 it('measures duplicate classification without inventing labels',()=>{const x=syntheticEvaluationDataset.duplicate.map(([id,expected,actual])=>({id,expected,actual}));const m=classificationMetrics(x);expect(m).toMatchObject({tp:2,fp:1,fn:1,tn:1});expect(m.precision).toBeCloseTo(2/3);expect(m.recall).toBeCloseTo(2/3);});
 it('measures recurrence and root-cause labeled cases',()=>{for(const key of ['recurrence','rootCause'] as const){const x=syntheticEvaluationDataset[key].map(([id,expected,actual])=>({id,expected,actual}));expect(classificationMetrics(x).precision).toBeGreaterThan(0);}});
 it('measures verification false acceptance/rejection',()=>{const x=syntheticEvaluationDataset.verification.map(([id,expected,actual])=>({id,expected,actual}));const m=classificationMetrics(x);expect(m.fp).toBe(1);expect(m.fn).toBe(1);});
 it('checks controlled monotonic impact-score behavior',()=>expect(monotonicScoreCheck([20,30,45,60])).toBe(true));
});
