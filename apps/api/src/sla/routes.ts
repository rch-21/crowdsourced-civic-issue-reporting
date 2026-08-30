import type { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { acknowledgeEscalation, checkAndEscalate, getPolicies, listAtRisk, listEscalations, recalculateSla } from './service.js';

export async function slaRoutes(app: FastifyInstance) {
  app.get('/sla/policies', { preHandler: requireRole('supervisor', 'administrator') }, async () => getPolicies());

  app.get('/sla/at-risk', { preHandler: requireRole('supervisor', 'administrator', 'officer') }, async () => listAtRisk());

  app.get('/sla/escalations', { preHandler: requireRole('supervisor', 'administrator') }, async (req: any) => listEscalations(req.query?.incidentId));

  app.get('/incidents/:id/sla', { preHandler: requireAuth }, async (req: any) => recalculateSla(req.params.id));

  app.post('/sla/escalations/:id/acknowledge', { preHandler: requireRole('supervisor', 'administrator') }, async (req: any) =>
    acknowledgeEscalation(req.params.id, req.user.id, req.body?.notes)
  );

  // Deterministic sweep: recomputes escalation levels for every open, breached incident.
  // Safe to call repeatedly (idempotent) — intended to be triggered by a scheduler once one exists,
  // and by administrators on demand until then.
  app.post('/sla/check', { preHandler: requireRole('administrator') }, async () => checkAndEscalate());
}
