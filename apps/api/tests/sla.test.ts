import { describe, expect, it } from 'vitest';
import { evaluateSlaStatus, escalationLevelFor } from '../src/sla/types.js';

describe('SLA due-date evaluation', () => {
  it('is ON_TRACK well before the deadline', () => {
    const now = new Date('2026-01-10T00:00:00Z');
    const createdAt = '2026-01-01T00:00:00Z';
    const r = evaluateSlaStatus(createdAt, 336, now, null); // 14-day LOW window
    expect(r.riskLevel).toBe('ON_TRACK');
    expect(r.breached).toBe(false);
  });

  it('is AT_RISK inside the final 24 hours', () => {
    const now = new Date('2026-01-02T20:00:00Z');
    const createdAt = '2026-01-01T00:00:00Z';
    const r = evaluateSlaStatus(createdAt, 48, now, null); // due 2026-01-03T00:00:00Z
    expect(r.riskLevel).toBe('AT_RISK');
    expect(r.breached).toBe(false);
    expect(r.hoursRemaining).toBeCloseTo(4, 0);
  });

  it('is BREACHED once past the deadline while still open', () => {
    const now = new Date('2026-01-05T00:00:00Z');
    const createdAt = '2026-01-01T00:00:00Z';
    const r = evaluateSlaStatus(createdAt, 24, now, null); // due 2026-01-02
    expect(r.riskLevel).toBe('BREACHED');
    expect(r.breached).toBe(true);
    expect(r.hoursRemaining).toBeLessThan(0);
  });

  it('evaluates against resolvedAt instead of now once the incident is closed', () => {
    // Resolved just before the deadline: NOT breached, even though "now" is long after.
    const createdAt = '2026-01-01T00:00:00Z';
    const resolvedAt = '2026-01-01T23:00:00Z';
    const farFuture = new Date('2026-06-01T00:00:00Z');
    const r = evaluateSlaStatus(createdAt, 24, farFuture, resolvedAt);
    expect(r.breached).toBe(false);
  });

  it('escalation level increases by one for each full escalation window elapsed', () => {
    expect(escalationLevelFor(0, 24)).toBe(1);
    expect(escalationLevelFor(23, 24)).toBe(1);
    expect(escalationLevelFor(24, 24)).toBe(2);
    expect(escalationLevelFor(49, 24)).toBe(3);
  });
});
