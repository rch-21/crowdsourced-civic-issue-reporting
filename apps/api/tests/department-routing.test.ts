import { describe, expect, it } from 'vitest';
import { detectDepartmentCode } from '../src/reporting/department-routing.js';

describe('custom problem department routing', () => {
  it('routes descriptions using explicit civic keyword rules', () => {
    expect(detectDepartmentCode('A large pothole is blocking the road')).toBe('ROADS');
    expect(detectDepartmentCode('Sewage is overflowing from the blocked drain')).toBe('WATER');
    expect(detectDepartmentCode('Garbage dumping beside the park')).toBe('WASTE');
    expect(detectDepartmentCode('Streetlight is broken and the area is dark')).toBe('LIGHTING');
  });
  it('returns no department when the description has no matching rule', () => {
    expect(detectDepartmentCode('A public facility needs attention')).toBeNull();
  });
});
