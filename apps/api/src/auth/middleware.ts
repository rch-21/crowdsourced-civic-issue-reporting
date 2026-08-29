import type { FastifyReply, FastifyRequest } from 'fastify';
import { authenticate } from './service.js';
import type { AuthUser, Permission, Role } from './types.js';
import { PERMISSIONS } from './types.js';

declare module 'fastify' { interface FastifyRequest { user: AuthUser | null } }

const rolePermissions: Record<Role, readonly Permission[]> = {
  citizen: [PERMISSIONS.REPORT_CREATE,PERMISSIONS.REPORT_OWN_READ,PERMISSIONS.COMMENT_CREATE,PERMISSIONS.VOTE_CREATE,PERMISSIONS.RESOLUTION_CONFIRM,PERMISSIONS.REPORT_REOPEN,PERMISSIONS.FEEDBACK_CREATE],
  officer: [PERMISSIONS.ASSIGNED_WORK_READ,PERMISSIONS.STATUS_UPDATE,PERMISSIONS.WORK_COMMENT,PERMISSIONS.RESOLUTION_EVIDENCE],
  supervisor: [PERMISSIONS.WARD_CASES_READ,PERMISSIONS.ASSIGNMENT_MANAGE,PERMISSIONS.ESCALATION_REVIEW,PERMISSIONS.FLAGGED_CASES_READ],
  administrator: [PERMISSIONS.USERS_MANAGE,PERMISSIONS.DEPARTMENTS_MANAGE,PERMISSIONS.CATEGORIES_MANAGE,PERMISSIONS.WARDS_MANAGE,PERMISSIONS.SETTINGS_MANAGE],
  public_viewer: [PERMISSIONS.PUBLIC_READ]
};

export function permissionsForRole(role: Role): readonly Permission[] { return rolePermissions[role] ?? []; }

function bearer(request: FastifyRequest): string | null {
  const value = request.headers.authorization;
  if (!value?.startsWith('Bearer ')) return null;
  return value.slice(7).trim() || null;
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const token = bearer(request);
  if (!token) return reply.code(401).send({ error: 'UNAUTHENTICATED', message: 'Authentication required' });
  const user = await authenticate(token);
  if (!user) return reply.code(401).send({ error: 'INVALID_SESSION', message: 'Session is invalid or expired' });
  request.user = user;
}

export function requirePermission(permission: Permission) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(request, reply);
    if (reply.sent) return;
    if (!request.user || !permissionsForRole(request.user.role).includes(permission)) {
      return reply.code(403).send({ error: 'FORBIDDEN', message: 'Insufficient permission' });
    }
  };
}

export function requireRole(...roles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(request, reply);
    if (reply.sent) return;
    if (!request.user || !roles.includes(request.user.role)) return reply.code(403).send({ error: 'FORBIDDEN', message: 'Role not permitted' });
  };
}

export function canAccessOwnResource(user: AuthUser, ownerId: string): boolean { return user.id === ownerId; }
