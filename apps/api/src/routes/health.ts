import type { FastifyInstance } from 'fastify';
import { checkDatabase } from '../lib/database.js';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (_request, reply) => {
    const database = await checkDatabase();
    const healthy = database;
    return reply.status(healthy ? 200 : 503).send({
      status: healthy ? 'ok' : 'degraded',
      service: 'civic-issue-api',
      version: 'v1',
      checks: { database: database ? 'up' : 'down' }
    });
  });
}
