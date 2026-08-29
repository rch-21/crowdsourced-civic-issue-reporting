-- Phase 9: explainable cross-issue root-cause hypotheses. These are reviewable
-- inferences and never assert an actual cause or trigger an intervention.
CREATE TABLE root_cause_hypotheses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  infrastructure_id uuid REFERENCES infrastructure_profiles(id) ON DELETE SET NULL,
  location geometry(Point,4326),
  suspected_cause_category varchar(160) NOT NULL,
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  supporting_evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  detection_method varchar(80) NOT NULL,
  review_status varchar(30) NOT NULL DEFAULT 'requires_investigation'
    CHECK (review_status IN ('requires_investigation','accepted','rejected')),
  review_notes text,
  reviewed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_root_cause_review ON root_cause_hypotheses(review_status, confidence DESC, created_at DESC);
CREATE INDEX idx_root_cause_infrastructure ON root_cause_hypotheses(infrastructure_id, created_at DESC);
CREATE INDEX idx_root_cause_location ON root_cause_hypotheses USING gist(location);

CREATE TABLE root_cause_hypothesis_incidents (
  hypothesis_id uuid NOT NULL REFERENCES root_cause_hypotheses(id) ON DELETE CASCADE,
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  relationship varchar(40) NOT NULL DEFAULT 'supporting',
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (hypothesis_id, incident_id)
);
CREATE INDEX idx_root_cause_hypothesis_incident ON root_cause_hypothesis_incidents(incident_id);

CREATE TABLE root_cause_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  radius_m numeric(10,2) NOT NULL CHECK (radius_m > 0),
  window_days integer NOT NULL CHECK (window_days > 0),
  minimum_distinct_categories integer NOT NULL CHECK (minimum_distinct_categories >= 2),
  minimum_incidents integer NOT NULL CHECK (minimum_incidents >= 2),
  minimum_confidence numeric(5,4) NOT NULL CHECK (minimum_confidence BETWEEN 0 AND 1),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO root_cause_config(radius_m,window_days,minimum_distinct_categories,minimum_incidents,minimum_confidence)
VALUES (500,365,2,3,0.55) ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE root_cause_hypotheses IS 'Explainable possible root-cause patterns. A hypothesis is model inference, not observed fact and not a confirmed cause.';
COMMENT ON TABLE root_cause_hypothesis_incidents IS 'Evidence links from a hypothesis to the incidents used to generate it.';
COMMENT ON TABLE root_cause_config IS 'Configurable deterministic detection thresholds for cross-issue pattern discovery.';
