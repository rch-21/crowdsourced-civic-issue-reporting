import type { FastifyInstance } from 'fastify';
import { requireRole } from '../auth/middleware.js';
import { abuseSummary, listAbuseEvents } from './service.js';

export async function abuseRoutes(app: FastifyInstance) {
  app.get('/abuse/events', { preHandler: requireRole('supervisor', 'administrator') }, async (req: any) => {
    const limit = Math.min(Number(req.query?.limit) || 100, 500);
    return listAbuseEvents(limit);
  });

  app.get('/abuse/summary', { preHandler: requireRole('supervisor', 'administrator') }, async () => abuseSummary());
}
