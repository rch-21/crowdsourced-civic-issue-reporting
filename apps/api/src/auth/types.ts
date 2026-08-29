export const ROLES = {
  CITIZEN: 'citizen',
  OFFICER: 'officer',
  SUPERVISOR: 'supervisor',
  ADMIN: 'administrator',
  PUBLIC: 'public_viewer'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const PERMISSIONS = {
  REPORT_CREATE: 'reports:create',
  REPORT_OWN_READ: 'reports:own:read',
  COMMENT_CREATE: 'comments:create',
  VOTE_CREATE: 'votes:create',
  RESOLUTION_CONFIRM: 'resolution:confirm',
  REPORT_REOPEN: 'reports:reopen',
  FEEDBACK_CREATE: 'feedback:create',
  ASSIGNED_WORK_READ: 'work:assigned:read',
  STATUS_UPDATE: 'work:status:update',
  WORK_COMMENT: 'work:comment',
  RESOLUTION_EVIDENCE: 'resolution:evidence',
  WARD_CASES_READ: 'ward:cases:read',
  ASSIGNMENT_MANAGE: 'assignments:manage',
  ESCALATION_REVIEW: 'escalations:review',
  FLAGGED_CASES_READ: 'cases:flagged:read',
  USERS_MANAGE: 'users:manage',
  DEPARTMENTS_MANAGE: 'departments:manage',
  CATEGORIES_MANAGE: 'categories:manage',
  WARDS_MANAGE: 'wards:manage',
  SETTINGS_MANAGE: 'settings:manage',
  PUBLIC_READ: 'public:read'
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export type AuthUser = { id: string; role: Role; email: string | null; displayName: string };
