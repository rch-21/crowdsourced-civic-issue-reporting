import { describe, expect, it } from 'vitest';
import { PERMISSIONS, ROLES } from '../src/auth/types.js';
import { canAccessOwnResource, permissionsForRole } from '../src/auth/middleware.js';

describe('permission matrix', () => {
  it('grants citizens only citizen capabilities', () => {
    const p = permissionsForRole(ROLES.CITIZEN);
    expect(p).toContain(PERMISSIONS.REPORT_CREATE);
    expect(p).toContain(PERMISSIONS.REPORT_OWN_READ);
    expect(p).not.toContain(PERMISSIONS.USERS_MANAGE);
    expect(p).not.toContain(PERMISSIONS.ASSIGNMENT_MANAGE);
  });

  it('grants officers operational work capabilities only', () => {
    const p = permissionsForRole(ROLES.OFFICER);
    expect(p).toContain(PERMISSIONS.ASSIGNED_WORK_READ);
    expect(p).toContain(PERMISSIONS.STATUS_UPDATE);
    expect(p).not.toContain(PERMISSIONS.WARD_CASES_READ);
    expect(p).not.toContain(PERMISSIONS.USERS_MANAGE);
  });

  it('grants supervisors ward and assignment capabilities', () => {
    const p = permissionsForRole(ROLES.SUPERVISOR);
    expect(p).toContain(PERMISSIONS.WARD_CASES_READ);
    expect(p).toContain(PERMISSIONS.ASSIGNMENT_MANAGE);
    expect(p).not.toContain(PERMISSIONS.USERS_MANAGE);
  });

  it('grants administrators administration capabilities', () => {
    const p = permissionsForRole(ROLES.ADMIN);
    expect(p).toContain(PERMISSIONS.USERS_MANAGE);
    expect(p).toContain(PERMISSIONS.WARDS_MANAGE);
    expect(p).not.toContain(PERMISSIONS.REPORT_CREATE);
  });

  it('limits public viewers to explicitly public access', () => {
    const p = permissionsForRole(ROLES.PUBLIC);
    expect(p).toEqual([PERMISSIONS.PUBLIC_READ]);
  });

  it('prevents cross-user ownership access', () => {
    expect(canAccessOwnResource({ id: 'u1', role: ROLES.CITIZEN, email: null, displayName: 'A' }, 'u1')).toBe(true);
    expect(canAccessOwnResource({ id: 'u1', role: ROLES.CITIZEN, email: null, displayName: 'A' }, 'u2')).toBe(false);
  });
});
