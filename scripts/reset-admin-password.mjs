import 'dotenv/config';
import pg from 'pg';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { hashPassword } from '../apps/api/src/auth/security.ts';

const { Pool } = pg;
const email = 'administrator@gmail.com';
const password = process.env.ADMIN_PASSWORD;

async function readPassword() {
  if (password) return password;
  const readline = createInterface({ input, output });
  try { return await readline.question(`New password for ${email}: `); }
  finally { readline.close(); }
}

const nextPassword = await readPassword();
if (!nextPassword || nextPassword.length < 12 || nextPassword.length > 128) {
  throw new Error('ADMIN_PASSWORD must be between 12 and 128 characters.');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? 'postgresql://civic:civic@localhost:55432/civic_issue' });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const found = await client.query(
    `SELECT u.id, u.status, u.email_verified_at, r.name AS role
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE lower(u.email) = lower($1) FOR UPDATE`,
    [email]
  );
  if (!found.rowCount) throw new Error(`Administrator demo account not found: ${email}`);
  if (found.rows[0].role !== 'administrator') throw new Error(`Refusing to change ${email}: its role is ${found.rows[0].role}.`);

  const passwordHash = await hashPassword(nextPassword);
  await client.query(
    `UPDATE users
     SET password_hash = $1, status = 'active', email_verified_at = COALESCE(email_verified_at, now()),
         password_changed_at = now(), updated_at = now()
     WHERE id = $2`,
    [passwordHash, found.rows[0].id]
  );
  await client.query('UPDATE auth_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [found.rows[0].id]);
  await client.query('COMMIT');
  console.log(`Administrator password updated for ${email}. Existing sessions were revoked.`);
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}

