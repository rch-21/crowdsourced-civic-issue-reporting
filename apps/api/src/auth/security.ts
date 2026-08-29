import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;
const TOKEN_BYTES = 32;

type ScryptOptions = { N: number; r: number; p: number };

function derive(password: string, salt: string, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, KEY_LENGTH, options, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

export function createOpaqueToken(): string { return randomBytes(TOKEN_BYTES).toString('base64url'); }

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('base64url');
  const derived = await derive(password, salt, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${derived.toString('base64url')}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [scheme, n, r, p, salt, expected] = encoded.split('$');
  if (scheme !== 'scrypt' || !n || !r || !p || !salt || !expected) return false;
  try {
    const actual = await derive(password, salt, { N: Number(n), r: Number(r), p: Number(p) });
    const target = Buffer.from(expected, 'base64url');
    return actual.length === target.length && timingSafeEqual(actual, target);
  } catch { return false; }
}

export const SESSION_TTL_DAYS = 7;
export const VERIFICATION_TTL_HOURS = 24;
export const RESET_TTL_HOURS = 1;
