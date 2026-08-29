CREATE TABLE impact_scoring_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  severity_weight numeric(6,4) NOT NULL CHECK (severity_weight >= 0),
  safety_weight numeric(6,4) NOT NULL CHECK (safety_weight >= 0),
  population_weight numeric(6,4) NOT NULL CHECK (population_weight >= 0),
  location_weight numeric(6,4) NOT NULL CHECK (location_weight >= 0),
  duration_weight numeric(6,4) NOT NULL CHECK (duration_weight >= 0),
  recurrence_weight numeric(6,4) NOT NULL CHECK (recurrence_weight >= 0),
  confirmation_weight numeric(6,4) NOT NULL CHECK (confirmation_weight >= 0),
  support_weight numeric(6,4) NOT NULL CHECK (support_weight >= 0),
  version varchar(40) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE incident_population_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  estimated_population integer NOT NULL CHECK (estimated_population >= 0), confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  contributing_factors jsonb NOT NULL DEFAULT '{}'::jsonb, calculation_version varchar(40) NOT NULL, calculated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_population_estimates_incident_time ON incident_population_estimates(incident_id, calculated_at DESC);

CREATE TABLE incident_impact_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  score numeric(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100), priority varchar(20) NOT NULL CHECK (priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  factors jsonb NOT NULL DEFAULT '{}'::jsonb, confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1), calculation_version varchar(40) NOT NULL, calculated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_impact_scores_incident_time ON incident_impact_scores(incident_id, calculated_at DESC);
CREATE INDEX idx_impact_scores_priority_score ON incident_impact_scores(priority, score DESC);

INSERT INTO impact_scoring_config (severity_weight,safety_weight,population_weight,location_weight,duration_weight,recurrence_weight,confirmation_weight,support_weight,version)
VALUES (0.18,0.22,0.18,0.14,0.10,0.06,0.06,0.06,'impact-v1') ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE incident_population_estimates IS 'Estimated, confidence-qualified population impact; never presented as an exact measurement.';
COMMENT ON TABLE incident_impact_scores IS 'Transparent decision-support score with persisted factor breakdown and calculation version.';
