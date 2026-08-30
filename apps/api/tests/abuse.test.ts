import { describe, expect, it } from 'vitest';
import { countWithinWindow, evaluateDuplicateContent, evaluateVelocity, normalizeText, textSimilarity } from '../src/abuse/types.js';

describe('Abuse detection: report velocity', () => {
  it('does not flag a citizen with no recent reports', () => {
    const r = evaluateVelocity([], new Date('2026-01-10T00:00:00Z'));
    expect(r).toBeNull();
  });

  it('does not flag under the threshold', () => {
    const now = new Date('2026-01-10T00:10:00Z');
    const recent = ['2026-01-10T00:05:00Z', '2026-01-10T00:06:00Z', '2026-01-10T00:07:00Z']; // 3 recent + 1 new = 4
    expect(evaluateVelocity(recent, now)).toBeNull();
  });

  it('flags at the FLAG threshold (5th report in the window)', () => {
    const now = new Date('2026-01-10T00:10:00Z');
    const recent = ['2026-01-10T00:01:00Z', '2026-01-10T00:02:00Z', '2026-01-10T00:03:00Z', '2026-01-10T00:04:00Z']; // 4 recent + 1 new = 5
    const r = evaluateVelocity(recent, now);
    expect(r?.severity).toBe('FLAG');
    expect(r?.type).toBe('REPORT_VELOCITY');
  });

  it('blocks at the BLOCK threshold (10th report in the window)', () => {
    const now = new Date('2026-01-10T00:10:00Z');
    const recent = Array.from({ length: 9 }, (_, i) => `2026-01-10T00:0${i}:00Z`);
    const r = evaluateVelocity(recent, now);
    expect(r?.severity).toBe('BLOCK');
  });

  it('ignores reports outside the time window', () => {
    const now = new Date('2026-01-10T01:00:00Z');
    const recent = Array.from({ length: 9 }, () => '2026-01-09T00:00:00Z'); // all an hour+ old, well outside a 10-minute window
    expect(evaluateVelocity(recent, now)).toBeNull();
  });

  it('countWithinWindow only counts timestamps at or after the cutoff', () => {
    const now = new Date('2026-01-10T00:20:00Z');
    const timestamps = ['2026-01-10T00:19:00Z', '2026-01-10T00:05:00Z', '2026-01-09T23:00:00Z'];
    expect(countWithinWindow(timestamps, now, 10)).toBe(1);
  });
});

describe('Abuse detection: duplicate content', () => {
  it('normalizes whitespace and case', () => {
    expect(normalizeText('  Pothole   on Main St.  ')).toBe('pothole on main st.');
  });

  it('similarity is 1 for identical text', () => {
    expect(textSimilarity('big pothole near the market', 'big pothole near the market')).toBe(1);
  });

  it('similarity is 0 for entirely different text', () => {
    expect(textSimilarity('big pothole near the market', 'streetlight is broken')).toBe(0);
  });

  it('similarity is high but not 1 for a lightly edited duplicate', () => {
    const s = textSimilarity('Large pothole on Main Street near the bus stop', 'Large pothole on Main Street close to the bus stop');
    expect(s).toBeGreaterThan(0.6);
    expect(s).toBeLessThan(1);
  });

  it('does not flag genuinely distinct descriptions', () => {
    const recent = ['Streetlight broken outside house 12', 'Garbage not collected on Elm Road'];
    expect(evaluateDuplicateContent('Water leak near the school gate', recent)).toBeNull();
  });

  it('flags at the FLAG threshold (3rd near-identical description)', () => {
    const recent = ['Pothole blocking the road near market', 'Pothole blocking the road near market'];
    const r = evaluateDuplicateContent('Pothole blocking the road near market', recent);
    expect(r?.severity).toBe('FLAG');
    expect(r?.type).toBe('DUPLICATE_CONTENT');
  });

  it('blocks at the BLOCK threshold (5th near-identical description)', () => {
    const recent = Array.from({ length: 4 }, () => 'Pothole blocking the road near market');
    const r = evaluateDuplicateContent('Pothole blocking the road near market', recent);
    expect(r?.severity).toBe('BLOCK');
  });
});
