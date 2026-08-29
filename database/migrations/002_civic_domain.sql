-- Civic domain model. PostgreSQL 16 + PostGIS.
-- IDs use UUIDs; timestamps use timestamptz; locations use WGS84 geometry.

CREATE TYPE user_status AS ENUM ('active','inactive','suspended');
CREATE TYPE report_status AS ENUM ('submitted','under_review','verified','assigned','in_progress','resolved','rejected','closed');
CREATE TYPE incident_status AS ENUM ('open','verified','assigned','in_progress','resolved','closed','reopened');
CREATE TYPE assignment_status AS ENUM ('assigned','accepted','in_progress','completed','cancelled');
CREATE TYPE escalation_status AS ENUM ('open','acknowledged','resolved','cancelled');
CREATE TYPE verification_result AS ENUM ('pending','confirmed','rejected','inconclusive');

CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(80) NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE role_permissions (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
  external_ref varchar(160) UNIQUE,
  display_name varchar(160) NOT NULL,
  email varchar(320),
  phone varchar(40),
  status user_status NOT NULL DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(160) NOT NULL,
  code varchar(40) UNIQUE,
  boundary geometry(MultiPolygon, 4326),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name varchar(160) NOT NULL,
  code varchar(40),
  boundary geometry(MultiPolygon, 4326),
  UNIQUE (city_id, code)
);

CREATE TABLE wards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  zone_id uuid REFERENCES zones(id) ON DELETE SET NULL,
  name varchar(160) NOT NULL,
  code varchar(40) NOT NULL,
  boundary geometry(MultiPolygon, 4326),
  UNIQUE (city_id, code)
);

CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(160) NOT NULL UNIQUE,
  code varchar(40) UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE issue_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  name varchar(160) NOT NULL,
  code varchar(60) NOT NULL UNIQUE,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE issue_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES issue_categories(id) ON DELETE CASCADE,
  name varchar(160) NOT NULL,
  code varchar(80) NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  UNIQUE (category_id, code)
);

CREATE TABLE severity_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(40) NOT NULL UNIQUE,
  name varchar(80) NOT NULL UNIQUE,
  level smallint NOT NULL CHECK (level > 0),
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id uuid REFERENCES users(id) ON DELETE SET NULL,
  category_id uuid NOT NULL REFERENCES issue_categories(id),
  subcategory_id uuid REFERENCES issue_subcategories(id) ON DELETE SET NULL,
  incident_id uuid,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  ward_id uuid REFERENCES wards(id) ON DELETE SET NULL,
  description text NOT NULL,
  location geometry(Point, 4326),
  address text,
  status report_status NOT NULL DEFAULT 'submitted',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  reported_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  storage_key text NOT NULL UNIQUE,
  media_type varchar(120) NOT NULL,
  file_size bigint CHECK (file_size >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES issue_categories(id),
  subcategory_id uuid REFERENCES issue_subcategories(id) ON DELETE SET NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  ward_id uuid REFERENCES wards(id) ON DELETE SET NULL,
  severity_id uuid REFERENCES severity_definitions(id) ON DELETE SET NULL,
  location geometry(Point, 4326),
  affected_area geometry(MultiPolygon, 4326),
  severity_score numeric(6,2),
  impact_score numeric(8,2),
  affected_population_estimate integer CHECK (affected_population_estimate IS NULL OR affected_population_estimate >= 0),
  status incident_status NOT NULL DEFAULT 'open',
  assigned_team_id uuid,
  recurrence_count integer NOT NULL DEFAULT 0 CHECK (recurrence_count >= 0),
  first_occurred_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reports ADD CONSTRAINT reports_incident_fk FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE SET NULL;

CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  name varchar(160) NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE incidents ADD CONSTRAINT incidents_team_fk FOREIGN KEY (assigned_team_id) REFERENCES teams(id) ON DELETE SET NULL;

CREATE TABLE incident_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type varchar(80) NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  old_status varchar(40),
  new_status varchar(40) NOT NULL,
  reason text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CHECK (incident_id IS NOT NULL OR report_id IS NOT NULL)
);

CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  assignee_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  assigned_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status assignment_status NOT NULL DEFAULT 'assigned',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz,
  completed_at timestamptz,
  CHECK (incident_id IS NOT NULL OR report_id IS NOT NULL)
);

CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
  author_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (incident_id IS NOT NULL OR report_id IS NOT NULL)
);

CREATE TABLE votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value smallint NOT NULL CHECK (value IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, user_id)
);

CREATE TABLE confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  result verification_result NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  rating smallint CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (incident_id IS NOT NULL OR report_id IS NOT NULL)
);

CREATE TABLE resolution_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  outcome text,
  notes text
);

CREATE TABLE sla_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  event_type varchar(80) NOT NULL,
  due_at timestamptz,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE verification_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
  verifier_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  result verification_result NOT NULL,
  notes text,
  verified_at timestamptz NOT NULL DEFAULT now(),
  CHECK (incident_id IS NOT NULL OR report_id IS NOT NULL)
);

CREATE TABLE escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  from_department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  to_department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status escalation_status NOT NULL DEFAULT 'open',
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  entity_type varchar(80) NOT NULL,
  entity_id uuid,
  action varchar(80) NOT NULL,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

-- Extension point for future infrastructure/location profiles. Details/history are intentionally deferred.
CREATE TABLE infrastructure_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid REFERENCES cities(id) ON DELETE SET NULL,
  ward_id uuid REFERENCES wards(id) ON DELETE SET NULL,
  infrastructure_type varchar(100) NOT NULL,
  name varchar(200),
  location geometry(Point, 4326),
  external_ref varchar(160) UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_wards_city ON wards(city_id);
CREATE INDEX idx_wards_boundary_gist ON wards USING gist(boundary);
CREATE INDEX idx_zones_boundary_gist ON zones USING gist(boundary);
CREATE INDEX idx_cities_boundary_gist ON cities USING gist(boundary);
CREATE INDEX idx_reports_citizen ON reports(citizen_id);
CREATE INDEX idx_reports_incident ON reports(incident_id);
CREATE INDEX idx_reports_category_status ON reports(category_id, status);
CREATE INDEX idx_reports_status_time ON reports(status, reported_at DESC);
CREATE INDEX idx_reports_reported_at ON reports(reported_at DESC);
CREATE INDEX idx_reports_location_gist ON reports USING gist(location);
CREATE INDEX idx_reports_ward_status ON reports(ward_id, status);
CREATE INDEX idx_incidents_status_time ON incidents(status, created_at DESC);
CREATE INDEX idx_incidents_category_status ON incidents(category_id, status);
CREATE INDEX idx_incidents_department_status ON incidents(department_id, status);
CREATE INDEX idx_incidents_location_gist ON incidents USING gist(location);
CREATE INDEX idx_incidents_area_gist ON incidents USING gist(affected_area);
CREATE INDEX idx_incidents_ward ON incidents(ward_id);
CREATE INDEX idx_incident_history_incident_time ON incident_history(incident_id, occurred_at DESC);
CREATE INDEX idx_status_history_incident_time ON status_history(incident_id, occurred_at DESC);
CREATE INDEX idx_status_history_report_time ON status_history(report_id, occurred_at DESC);
CREATE INDEX idx_assignments_incident_status ON assignments(incident_id, status);
CREATE INDEX idx_assignments_assignee_status ON assignments(assignee_user_id, status);
CREATE INDEX idx_comments_incident_time ON comments(incident_id, created_at DESC);
CREATE INDEX idx_feedback_incident ON feedback(incident_id);
CREATE INDEX idx_resolution_attempts_incident_time ON resolution_attempts(incident_id, attempted_at DESC);
CREATE INDEX idx_sla_events_incident_time ON sla_events(incident_id, occurred_at DESC);
CREATE INDEX idx_verification_results_incident_time ON verification_results(incident_id, verified_at DESC);
CREATE INDEX idx_escalations_incident_status ON escalations(incident_id, status);
CREATE INDEX idx_audit_entity_time ON audit_logs(entity_type, entity_id, occurred_at DESC);
CREATE INDEX idx_audit_actor_time ON audit_logs(actor_user_id, occurred_at DESC);
CREATE INDEX idx_infrastructure_location_gist ON infrastructure_profiles USING gist(location);
CREATE INDEX idx_infrastructure_ward ON infrastructure_profiles(ward_id);

COMMENT ON TABLE users IS 'People and service identities participating in the platform.';
COMMENT ON TABLE cities IS 'Municipal geographic containers with optional PostGIS boundaries.';
COMMENT ON TABLE wards IS 'Primary administrative units used for routing and geographic analysis.';
COMMENT ON TABLE reports IS 'Immutable citizen-submission record; retained independently from incident clustering.';
COMMENT ON TABLE incidents IS 'Underlying civic problem that may aggregate many reports.';
COMMENT ON TABLE infrastructure_profiles IS 'Minimal future extension point for infrastructure/location entities; history is intentionally out of scope.';
