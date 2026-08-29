-- Phase 8: persistent infrastructure/location identity and recurrence evidence.
ALTER TABLE infrastructure_profiles ALTER COLUMN location TYPE geometry(Geometry, 4326) USING location::geometry;
ALTER TABLE infrastructure_profiles ADD COLUMN IF NOT EXISTS responsible_department_id uuid REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE infrastructure_profiles ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

CREATE TABLE infrastructure_incidents (
  infrastructure_id uuid NOT NULL REFERENCES infrastructure_profiles(id) ON DELETE CASCADE,
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  relationship varchar(30) NOT NULL DEFAULT 'historical' CHECK (relationship IN ('historical','current','related')),
  linked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (infrastructure_id, incident_id)
);
CREATE INDEX idx_infrastructure_incidents_asset ON infrastructure_incidents(infrastructure_id, linked_at DESC);
CREATE INDEX idx_infrastructure_incidents_incident ON infrastructure_incidents(incident_id);

CREATE TABLE infrastructure_interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  infrastructure_id uuid NOT NULL REFERENCES infrastructure_profiles(id) ON DELETE CASCADE,
  incident_id uuid REFERENCES incidents(id) ON DELETE SET NULL,
  performed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  intervention_type varchar(120) NOT NULL,
  description text,
  performed_at timestamptz NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_infrastructure_interventions_timeline ON infrastructure_interventions(infrastructure_id, performed_at DESC);

CREATE TABLE recurrence_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  minimum_occurrences integer NOT NULL CHECK (minimum_occurrences >= 2),
  window_months integer NOT NULL CHECK (window_months > 0),
  radius_m numeric(10,2) NOT NULL CHECK (radius_m > 0),
  require_related_category boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO recurrence_config(minimum_occurrences,window_months,radius_m,require_related_category)
VALUES (3,18,100,true) ON CONFLICT (id) DO NOTHING;

CREATE TABLE recurrence_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  infrastructure_id uuid REFERENCES infrastructure_profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES issue_categories(id) ON DELETE SET NULL,
  occurrence_count integer NOT NULL CHECK (occurrence_count >= 0),
  period_start timestamptz,
  period_end timestamptz,
  last_occurrence_at timestamptz,
  is_recurring boolean NOT NULL DEFAULT false,
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  calculation_version varchar(40) NOT NULL,
  calculated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_recurrence_asset_time ON recurrence_assessments(infrastructure_id, calculated_at DESC);
CREATE INDEX idx_recurrence_current ON recurrence_assessments(is_recurring, occurrence_count DESC, calculated_at DESC);

COMMENT ON TABLE infrastructure_profiles IS 'Persistent location/asset abstraction. A GPS point is not automatically an asset; profiles represent known or explicitly established civic locations.';
COMMENT ON TABLE infrastructure_incidents IS 'Historical relationship between a civic infrastructure/location profile and incidents without deleting or rewriting incidents.';
COMMENT ON TABLE infrastructure_interventions IS 'Append-only intervention history for an infrastructure/location profile.';
COMMENT ON TABLE recurrence_assessments IS 'Evidence-based recurrence candidates. A recurring classification does not assert defect or root cause.';
