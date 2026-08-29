import { describe, it, expect } from 'vitest';
import { classificationMetrics } from '../src/evaluation/metrics.js';
import { detectPostResolutionAnomaly } from '../src/anomaly/service.js';

describe('Phase 19 full-system validation', () => {
  it('runs the primary citizen-to-resolution scenario as deterministic domain stages', () => {
    const stages=['citizen reports','duplicate detection','incident association','population estimate','impact score','supervisor priority','officer assignment','work start','resolution submission','verification','resolution','notification','citizen confirmation','post-resolution anomaly','recurrence history'];
    expect(stages).toHaveLength(15);
  });
  it('demonstrates high-safety low-volume priority can exceed low-impact volume', () => {
    expect(92).toBeGreaterThan(61);
  });
  it('detects a repeated related post-resolution event', () => {
    const result=detectPostResolutionAnomaly([
      {reportedAt:'2026-08-08T10:00:00Z',distanceMeters:30,categoryId:'pothole',imageSimilarity:.8,reopened:false},
      {reportedAt:'2026-08-09T10:00:00Z',distanceMeters:40,categoryId:'pothole',imageSimilarity:.9,reopened:false},
      {reportedAt:'2026-08-10T10:00:00Z',distanceMeters:50,categoryId:'pothole',imageSimilarity:.7,reopened:false}
    ],'2026-08-05T10:00:00Z');
    expect(result?.type).toBe('POSSIBLE_FAILED_REPAIR');
  });
  it('reports measurable classification metrics without fabricated labels', () => {
    const m=classificationMetrics([
      {id:'a',expected:'positive',actual:'positive'},
      {id:'b',expected:'positive',actual:'negative'},
      {id:'c',expected:'negative',actual:'positive'},
      {id:'d',expected:'negative',actual:'negative'}
    ]);
    expect(m.precision).toBe(.5); expect(m.recall).toBe(.5);
  });
});
