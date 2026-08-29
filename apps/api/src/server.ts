import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { config } from './config.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { accessRoutes } from './routes/access.js';
import { reportingRoutes } from './reporting/routes.js';
import { clusteringRoutes } from './clustering/routes.js';
import { impactRoutes } from './impact/routes.js';
import { incidentRoutes } from './incident/routes.js';
import { verificationRoutes } from './verification/routes.js';
import { rootCauseRoutes } from './rootCause/routes.js';
import { recurrenceRoutes } from './recurrence/routes.js';
import { predictiveRoutes } from './predictive/routes.js';
import { anomalyRoutes } from './anomaly/routes.js';
import { optimizationRoutes } from './optimization/routes.js';
import { publicRoutes } from './public/routes.js';
import { crossDepartmentRoutes } from './crossDepartment/routes.js';
import { notificationRoutes } from './notifications/routes.js';
import { registerSecurityHardening } from './security/hardening.js';

export function buildApp() {
  const app = Fastify({ logger: { level: config.LOG_LEVEL }, bodyLimit: config.BODY_LIMIT });
  registerErrorHandler(app);
  registerSecurityHardening(app);

  app.register(helmet);
  const corsOrigins = config.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean);
  app.register(cors, { origin: corsOrigins });

  app.register(async (api) => {
    api.register(healthRoutes);
    api.register(authRoutes);
    api.register(accessRoutes);
    api.register(reportingRoutes);
    api.register(clusteringRoutes);
    api.register(impactRoutes);
    api.register(incidentRoutes);
    api.register(verificationRoutes);
    api.register(recurrenceRoutes);
    api.register(rootCauseRoutes);
    api.register(predictiveRoutes);
    api.register(anomalyRoutes);
    api.register(optimizationRoutes);
    api.register(publicRoutes);
    api.register(crossDepartmentRoutes);
    api.register(notificationRoutes);
  }, { prefix: '/api/v1' });

  return app;
}

const app = buildApp();

if (process.env.NODE_ENV !== 'test') {
  app.listen({ host: config.HOST, port: config.PORT })
    .then(() => app.log.info(`API listening on ${config.HOST}:${config.PORT}`))
    .catch((error) => {
      app.log.error(error);
      process.exit(1);
    });
}




