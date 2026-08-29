import {describe,it,expect} from 'vitest';
import {permissionsForRole} from '../src/auth/middleware.js';
import {PERMISSIONS} from '../src/auth/types.js';
import {hashPassword,verifyPassword} from '../src/auth/security.js';
describe('Phase 17 security hardening',()=>{
 it('password verification rejects wrong passwords',async()=>{const h=await hashPassword('Correct horse battery staple 123!');expect(await verifyPassword('wrong',h)).toBe(false);expect(await verifyPassword('Correct horse battery staple 123!',h)).toBe(true);});
 it('citizen cannot receive administrative permissions',()=>{const p=permissionsForRole('citizen');expect(p).not.toContain(PERMISSIONS.USERS_MANAGE);expect(p).not.toContain(PERMISSIONS.SETTINGS_MANAGE);});
 it('officer cannot receive assignment management',()=>expect(permissionsForRole('officer')).not.toContain(PERMISSIONS.ASSIGNMENT_MANAGE));
 it('supervisor cannot receive user management',()=>expect(permissionsForRole('supervisor')).not.toContain(PERMISSIONS.USERS_MANAGE));
 it('public viewer has only public read capability',()=>expect(permissionsForRole('public_viewer')).toEqual([PERMISSIONS.PUBLIC_READ]));
});
