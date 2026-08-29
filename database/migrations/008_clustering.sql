CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE clustering_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  geographic_threshold_m numeric(10,2) NOT NULL CHECK (geographic_threshold_m > 0),
  temporal_window_hours integer NOT NULL CHECK (temporal_window_hours > 0),
  category_match_required boolean NOT NULL DEFAULT true,
  description_similarity_threshold numeric(5,4) NOT NULL CHECK (description_similarity_threshold BETWEEN 0 AND 1),
  image_similarity_threshold numeric(5,4) NOT NULL CHECK (image_similarity_threshold BETWEEN 0 AND 1),
  confidence_threshold numeric(5,4) NOT NULL CHECK (confidence_threshold BETWEEN 0 AND 1),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE incident_associations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  geographic_score numeric(5,4) NOT NULL CHECK (geographic_score BETWEEN 0 AND 1),
  category_score numeric(5,4) NOT NULL CHECK (category_score BETWEEN 0 AND 1),
  description_score numeric(5,4) NOT NULL CHECK (description_score BETWEEN 0 AND 1),
  image_score numeric(5,4) NOT NULL CHECK (image_score BETWEEN 0 AND 1),
  temporal_score numeric(5,4) NOT NULL CHECK (temporal_score BETWEEN 0 AND 1),
  decision varchar(20) NOT NULL CHECK (decision IN ('suggested','associated','unlinked','split')),
  explanation jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid REFERENCES users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX uq_active_report_incident_association ON incident_associations(report_id) WHERE decision = 'associated';
CREATE INDEX idx_incident_associations_incident ON incident_associations(incident_id, created_at DESC);
CREATE INDEX idx_incident_associations_report ON incident_associations(report_id, created_at DESC);
CREATE INDEX idx_incident_associations_suggested ON incident_associations(decision, confidence DESC);
CREATE INDEX idx_reports_description_trgm ON reports USING gin (description gin_trgm_ops);

INSERT INTO clustering_config (geographic_threshold_m, temporal_window_hours, category_match_required, description_similarity_threshold, image_similarity_threshold, confidence_threshold)
VALUES (150, 72, true, 0.35, 0.75, 0.65)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE clustering_config IS 'Runtime thresholds for multi-signal duplicate detection; values are configurable and not scattered through code.';
COMMENT ON TABLE incident_associations IS 'Explainable report-to-incident clustering decisions and candidate suggestions; reports are never deleted.';
