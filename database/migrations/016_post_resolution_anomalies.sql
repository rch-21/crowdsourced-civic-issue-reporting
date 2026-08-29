-- Phase 12: non-blaming post-resolution anomaly detection.
CREATE TABLE post_resolution_anomalies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resolved_incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  anomaly_type varchar(60) NOT NULL CHECK (anomaly_type IN ('RECURRING_AFTER_RESOLUTION','POSSIBLE_FAILED_REPAIR','POSSIBLE_REOCCURRENCE','INSUFFICIENT_EVIDENCE')),
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  detected_at timestamptz NOT NULL DEFAULT now(), monitoring_until timestamptz,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb, algorithm_version varchar(40) NOT NULL
);
CREATE INDEX idx_post_resolution_anomaly_incident_time ON post_resolution_anomalies(resolved_incident_id, detected_at DESC);
CREATE INDEX idx_post_resolution_anomaly_type_confidence ON post_resolution_anomalies(anomaly_type, confidence DESC, detected_at DESC);
CREATE TABLE post_resolution_anomaly_reports (
  anomaly_id uuid NOT NULL REFERENCES post_resolution_anomalies(id) ON DELETE CASCADE,
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  relation varchar(40) NOT NULL CHECK (relation IN ('RELATED','UNRELATED','REOPENED')),
  similarity numeric(5,4), evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY(anomaly_id, report_id)
);
CREATE TABLE post_resolution_anomaly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), anomaly_id uuid NOT NULL REFERENCES post_resolution_anomalies(id) ON DELETE CASCADE,
  reviewer_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  decision varchar(40) NOT NULL CHECK (decision IN ('DISMISS','REOPEN','CREATE_INCIDENT','LINK_INCIDENT','REQUEST_INSPECTION')),
  note text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_post_resolution_reviews_anomaly ON post_resolution_anomaly_reviews(anomaly_id, created_at DESC);
COMMENT ON TABLE post_resolution_anomalies IS 'Evidence-based anomaly signals after resolution; not officer or department misconduct determinations.';
