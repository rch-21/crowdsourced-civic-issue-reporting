import type { FastifyInstance } from 'fastify';
import { requireAuth, requirePermission, requireRole } from '../auth/middleware.js';
import { PERMISSIONS } from '../auth/types.js';
import { db } from '../lib/database.js';

export async function accessRoutes(app: FastifyInstance) {
  app.get('/auth/me', { preHandler: requireAuth }, async (request) => ({ user: request.user }));
  app.get('/reference/categories', { preHandler: requireAuth }, async () => {
    const { rows } = await db.query(`SELECT id,name,code,description,department_id AS "departmentId" FROM issue_categories ORDER BY name`);
    return rows;
  });
  app.get('/reference/departments', { preHandler: requireRole('officer','supervisor','administrator') }, async () => {
    const { rows } = await db.query(`SELECT id,name,code,description FROM departments ORDER BY name`);
    return rows;
  });
  app.get('/reference/officers', { preHandler: requireRole('supervisor','administrator') }, async () => {
    const { rows } = await db.query(
      `SELECT u.id, u.display_name AS "displayName", r.name AS role
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE r.name = 'officer' AND u.status = 'active'
       ORDER BY u.display_name`
    );
    return rows;
  });
  app.get('/access/citizen', { preHandler: requirePermission(PERMISSIONS.REPORT_CREATE) }, async () => ({ authorized: true, role: 'citizen' }));
  app.get('/access/officer', { preHandler: requirePermission(PERMISSIONS.ASSIGNED_WORK_READ) }, async () => ({ authorized: true, role: 'officer' }));
  app.get('/access/supervisor', { preHandler: requirePermission(PERMISSIONS.WARD_CASES_READ) }, async () => ({ authorized: true, role: 'supervisor' }));
  app.get('/access/administrator', { preHandler: requirePermission(PERMISSIONS.USERS_MANAGE) }, async () => ({ authorized: true, role: 'administrator' }));
  app.get('/public/info', { preHandler: requirePermission(PERMISSIONS.PUBLIC_READ) }, async () => ({ public: true }));
}
