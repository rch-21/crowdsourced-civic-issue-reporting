import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/server.js';
import { db } from '../src/lib/database.js';

describe('API foundation', () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
    await db.end();
  });

  it('exposes a versioned health endpoint', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/health' });
    expect([200, 503]).toContain(response.statusCode);
    expect(response.json()).toMatchObject({
      service: 'civic-issue-api',
      version: 'v1',
      checks: { database: expect.any(String) }
    });
  });
});
