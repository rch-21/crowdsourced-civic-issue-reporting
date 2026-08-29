import { describe, expect, it } from 'vitest';
import { hashPassword, hashToken, verifyPassword } from '../src/auth/security.js';

describe('authentication security primitives', () => {
  it('hashes passwords with salted scrypt and verifies them', async () => {
    const hash = await hashPassword('A-strong-password-123');
    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(await verifyPassword('A-strong-password-123', hash)).toBe(true);
    expect(await verifyPassword('wrong-password-123', hash)).toBe(false);
  });

  it('produces deterministic hashes for server-side token lookup', () => {
    expect(hashToken('token-a')).toBe(hashToken('token-a'));
    expect(hashToken('token-a')).not.toBe(hashToken('token-b'));
  });
});
