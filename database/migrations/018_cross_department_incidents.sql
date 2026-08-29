-- Phase 14: one incident can coordinate multiple departments and explicit workstreams.
CREATE TABLE incident_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  responsibility varchar(20) NOT NULL CHECK (responsibility IN ('LEAD','SUPPORTING')),
  assigned_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL, assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (incident_id, department_id)
);
CREATE UNIQUE INDEX uq_incident_lead_department ON incident_departments(incident_id) WHERE responsibility='LEAD';
CREATE INDEX idx_incident_departments_department ON incident_departments(department_id,incident_id);

CREATE TABLE incident_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE RESTRICT, owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title varchar(240) NOT NULL, description text, status varchar(30) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','ASSIGNED','IN_PROGRESS','BLOCKED','COMPLETED','FAILED','CANCELLED')),
  due_at timestamptz, completed_at timestamptz, created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_incident_tasks_incident_status ON incident_tasks(incident_id,status);
CREATE INDEX idx_incident_tasks_department_status ON incident_tasks(department_id,status);
CREATE INDEX idx_incident_tasks_owner_status ON incident_tasks(owner_user_id,status);

CREATE TABLE incident_task_dependencies (
  task_id uuid NOT NULL REFERENCES incident_tasks(id) ON DELETE CASCADE, depends_on_task_id uuid NOT NULL REFERENCES incident_tasks(id) ON DELETE CASCADE,
  PRIMARY KEY(task_id,depends_on_task_id), CHECK(task_id<>depends_on_task_id)
);
CREATE INDEX idx_task_dependencies_depends_on ON incident_task_dependencies(depends_on_task_id);

CREATE TABLE incident_task_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), task_id uuid NOT NULL REFERENCES incident_tasks(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL, old_status varchar(30), new_status varchar(30), event_type varchar(50) NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb, occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_incident_task_history_task_time ON incident_task_history(task_id,occurred_at DESC);

CREATE TABLE incident_department_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL, actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action varchar(60) NOT NULL, details jsonb NOT NULL DEFAULT '{}'::jsonb, occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_incident_department_audit_incident_time ON incident_department_audit(incident_id,occurred_at DESC);

COMMENT ON TABLE incident_departments IS 'Explicit lead/supporting department responsibility for a coordinated incident.';
COMMENT ON TABLE incident_tasks IS 'Independent departmental workstreams; completing one task never resolves the parent incident.';
COMMENT ON TABLE incident_task_dependencies IS 'Optional task ordering constraints within a multi-department incident.';
COMMENT ON TABLE incident_task_history IS 'Immutable task status/assignment history for auditability.';

CREATE TABLE incident_task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), task_id uuid NOT NULL REFERENCES incident_tasks(id) ON DELETE CASCADE,
  author_user_id uuid REFERENCES users(id) ON DELETE SET NULL, body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_incident_task_comments_task_time ON incident_task_comments(task_id,created_at DESC);
