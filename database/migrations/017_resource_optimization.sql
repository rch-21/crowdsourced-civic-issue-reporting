-- Phase 13: resource optimization decision support. Recommendations never dispatch automatically.
CREATE TABLE worker_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  current_location geometry(Point,4326),
  availability_status varchar(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (availability_status IN ('AVAILABLE','UNAVAILABLE','OFF_DUTY')),
  working_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  max_concurrent_incidents integer NOT NULL DEFAULT 3 CHECK (max_concurrent_incidents > 0),
  estimated_work_minutes integer NOT NULL DEFAULT 60 CHECK (estimated_work_minutes > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_worker_profiles_department_availability ON worker_profiles(department_id,availability_status);
CREATE INDEX idx_worker_profiles_location ON worker_profiles USING gist(current_location);

CREATE TABLE worker_skills (
  user_id uuid NOT NULL REFERENCES worker_profiles(user_id) ON DELETE CASCADE,
  skill_code varchar(80) NOT NULL,
  proficiency smallint CHECK (proficiency BETWEEN 1 AND 5),
  PRIMARY KEY(user_id,skill_code)
);
CREATE INDEX idx_worker_skills_skill ON worker_skills(skill_code,user_id);

ALTER TABLE incidents ADD COLUMN IF NOT EXISTS required_skills jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS estimated_work_minutes integer CHECK (estimated_work_minutes IS NULL OR estimated_work_minutes > 0);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS sla_due_at timestamptz;
CREATE INDEX idx_incidents_sla_queue ON incidents(sla_due_at,status,department_id) WHERE sla_due_at IS NOT NULL;

CREATE TABLE optimization_config (
  id boolean PRIMARY KEY DEFAULT true CHECK(id), impact_weight numeric(6,4) NOT NULL DEFAULT .30, sla_weight numeric(6,4) NOT NULL DEFAULT .25,
  distance_weight numeric(6,4) NOT NULL DEFAULT .20, skill_weight numeric(6,4) NOT NULL DEFAULT .15, workload_weight numeric(6,4) NOT NULL DEFAULT .10,
  max_distance_km numeric(8,2) NOT NULL DEFAULT 50, updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO optimization_config(id) VALUES(true) ON CONFLICT DO NOTHING;

CREATE TABLE assignment_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  worker_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, rank integer NOT NULL, score numeric(8,4) NOT NULL,
  rationale jsonb NOT NULL DEFAULT '{}'::jsonb, estimated_travel_km numeric(10,3), estimated_completion_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), algorithm_version varchar(60) NOT NULL
);
CREATE INDEX idx_assignment_recommendations_incident ON assignment_recommendations(incident_id,rank);
CREATE INDEX idx_assignment_recommendations_worker ON assignment_recommendations(worker_user_id,created_at DESC);

CREATE TABLE assignment_recommendation_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), recommendation_id uuid NOT NULL REFERENCES assignment_recommendations(id) ON DELETE CASCADE,
  supervisor_user_id uuid REFERENCES users(id) ON DELETE SET NULL, decision varchar(30) NOT NULL CHECK(decision IN ('ACCEPT','MODIFY','REJECT','MANUAL_ASSIGN')),
  selected_worker_user_id uuid REFERENCES users(id) ON DELETE SET NULL, note text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_assignment_recommendation_decisions_rec ON assignment_recommendation_decisions(recommendation_id,created_at DESC);
COMMENT ON TABLE assignment_recommendations IS 'Human-reviewable assignment recommendations; creation does not assign or dispatch workers.';
