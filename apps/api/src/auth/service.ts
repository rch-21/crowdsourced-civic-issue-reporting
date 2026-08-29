import { db } from '../lib/database.js';
import { createOpaqueToken, hashPassword, hashToken, verifyPassword, SESSION_TTL_DAYS, VERIFICATION_TTL_HOURS, RESET_TTL_HOURS } from './security.js';
import type { AuthUser, Role } from './types.js';

const publicUser = (row: { id: string; role: string; email: string | null; display_name: string }): AuthUser => ({ id: row.id, role: row.role as Role, email: row.email, displayName: row.display_name });

export async function register(displayName: string, email: string, password: string, role: Role = 'citizen') {
  const passwordHash = await hashPassword(password);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', [role]);
    if (!roleResult.rowCount) throw new Error('ROLE_NOT_FOUND');
    const userResult = await client.query(
      `INSERT INTO users (role_id, display_name, email, password_hash) VALUES ($1,$2,lower($3),$4) RETURNING id, role_id, email, display_name`,
      [roleResult.rows[0].id, displayName, email, passwordHash]
    );
    const userId = userResult.rows[0].id;
    const token = createOpaqueToken();
    await client.query(
      `INSERT INTO account_verification_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,now() + ($3 || ' hours')::interval)`,
      [userId, hashToken(token), VERIFICATION_TTL_HOURS]
    );
    await client.query('COMMIT');
    return { userId, verificationToken: token };
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}

export async function login(email: string, password: string) {
  const result = await db.query(
    `SELECT u.id,u.email,u.display_name,u.password_hash,u.email_verified_at,u.status,r.name AS role FROM users u LEFT JOIN roles r ON r.id=u.role_id WHERE lower(u.email)=lower($1)`,
    [email]
  );
  const row = result.rows[0];
  if (!row || !row.password_hash || row.status !== 'active' || !(await verifyPassword(password, row.password_hash))) throw new Error('INVALID_CREDENTIALS');
  if (!row.email_verified_at) throw new Error('EMAIL_NOT_VERIFIED');
  const token = createOpaqueToken();
  await db.query(`INSERT INTO auth_sessions (user_id,token_hash,expires_at) VALUES ($1,$2,now() + ($3 || ' days')::interval)`, [row.id, hashToken(token), SESSION_TTL_DAYS]);
  return { token, user: publicUser(row) };
}

export async function authenticate(token: string): Promise<AuthUser | null> {
  const result = await db.query(
    `SELECT u.id,u.email,u.display_name,u.status,r.name AS role FROM auth_sessions s JOIN users u ON u.id=s.user_id JOIN roles r ON r.id=u.role_id WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at > now() AND u.status='active'`,
    [hashToken(token)]
  );
  if (!result.rowCount) return null;
  await db.query('UPDATE auth_sessions SET last_used_at=now() WHERE token_hash=$1', [hashToken(token)]);
  return publicUser(result.rows[0]);
}

export async function logout(token: string) { await db.query('UPDATE auth_sessions SET revoked_at=now() WHERE token_hash=$1', [hashToken(token)]); }

export async function verifyAccount(token: string) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query(`SELECT user_id FROM account_verification_tokens WHERE token_hash=$1 AND consumed_at IS NULL AND expires_at > now() FOR UPDATE`, [hashToken(token)]);
    if (!found.rowCount) throw new Error('INVALID_VERIFICATION_TOKEN');
    await client.query('UPDATE users SET email_verified_at=now(),updated_at=now() WHERE id=$1', [found.rows[0].user_id]);
    await client.query('UPDATE account_verification_tokens SET consumed_at=now() WHERE token_hash=$1', [hashToken(token)]);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}

export async function requestPasswordReset(email: string) {
  const result = await db.query('SELECT id FROM users WHERE lower(email)=lower($1) AND status=\'active\'', [email]);
  if (!result.rowCount) return null;
  const token = createOpaqueToken();
  await db.query(`INSERT INTO password_reset_tokens (user_id,token_hash,expires_at) VALUES ($1,$2,now() + ($3 || ' hours')::interval)`, [result.rows[0].id, hashToken(token), RESET_TTL_HOURS]);
  return token;
}

export async function resetPassword(token: string, password: string) {
  const hash = await hashPassword(password);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query(`SELECT user_id FROM password_reset_tokens WHERE token_hash=$1 AND consumed_at IS NULL AND expires_at > now() FOR UPDATE`, [hashToken(token)]);
    if (!found.rowCount) throw new Error('INVALID_RESET_TOKEN');
    await client.query('UPDATE users SET password_hash=$1,password_changed_at=now(),updated_at=now() WHERE id=$2', [hash, found.rows[0].user_id]);
    await client.query('UPDATE password_reset_tokens SET consumed_at=now() WHERE token_hash=$1', [hashToken(token)]);
    await client.query('UPDATE auth_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL', [found.rows[0].user_id]);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
