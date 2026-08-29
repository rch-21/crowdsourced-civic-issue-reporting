import { describe, expect, it } from 'vitest';
import { allowedTransitions, canTransition } from '../src/reporting/state-machine.js';

describe('report status state machine', () => {
  it('allows the intended forward workflow', () => {
    expect(canTransition('REPORTED','ACKNOWLEDGED')).toBe(true);
    expect(canTransition('ACKNOWLEDGED','ASSIGNED')).toBe(true);
    expect(canTransition('ASSIGNED','IN_PROGRESS')).toBe(true);
    expect(canTransition('IN_PROGRESS','PENDING_VERIFICATION')).toBe(true);
    expect(canTransition('PENDING_VERIFICATION','RESOLVED')).toBe(true);
    expect(canTransition('RESOLVED','CONFIRMED')).toBe(true);
  });

  it('allows permitted reopening and flagging', () => {
    expect(canTransition('RESOLVED','REOPENED')).toBe(true);
    expect(canTransition('CONFIRMED','REOPENED')).toBe(true);
    expect(canTransition('REPORTED','FLAGGED')).toBe(true);
  });

  it('rejects arbitrary transitions', () => {
    expect(canTransition('REPORTED','RESOLVED')).toBe(false);
    expect(canTransition('CONFIRMED','REPORTED')).toBe(false);
    expect(canTransition('IN_PROGRESS','CONFIRMED')).toBe(false);
  });

  it('returns only controlled next states', () => {
    expect(allowedTransitions('REPORTED')).toEqual(['ACKNOWLEDGED','FLAGGED']);
  });
});
