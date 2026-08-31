import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

export const db = new Pool({
  connectionString: config.DATABASE_URL,
  // Supabase requires encrypted PostgreSQL connections. Keep SSL explicit so
  // the API works consistently on Render even when the URI lacks sslmode.
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000
});

export async function checkDatabase(): Promise<boolean> {
  try {
    await db.query('SELECT 1');
    return true;
  } catch (error) {
    const err = error as { code?: string; message?: string; name?: string };
    console.error('Database health check failed', { code: err.code, name: err.name, message: err.message });
    return false;
  }
}

