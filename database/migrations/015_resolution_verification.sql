-- Phase 11: evidence-based automated resolution verification.
ALTER TYPE incident_status ADD VALUE IF NOT EXISTS 'pending_verification';
ALTER TYPE incident_status ADD VALUE IF NOT EXISTS 'flagged';

CREATE TABLE resolution_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  submitted_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL, resolution_latitude numeric(10,7), resolution_longitude numeric(10,7),
  submitted_at timestamptz NOT NULL DEFAULT now(), note text, algorithm_version varchar(40) NOT NULL DEFAULT 'resolution-verification-v1'
);
CREATE INDEX idx_resolution_submissions_incident_time ON resolution_submissions(incident_id, submitted_at DESC);
CREATE TABLE resolution_submission_media (
  submission_id uuid NOT NULL REFERENCES resolution_submissions(id) ON DELETE CASCADE, media_id uuid, storage_key text,
  media_type varchar(120), captured_at timestamptz, sha256 text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (submission_id, storage_key)
);
CREATE INDEX idx_resolution_media_hash ON resolution_submission_media(sha256) WHERE sha256 IS NOT NULL;
CREATE TABLE resolution_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), submission_id uuid NOT NULL REFERENCES resolution_submissions(id) ON DELETE CASCADE,
  overall_result varchar(30) NOT NULL CHECK (overall_result IN ('PASS','FAIL','INCONCLUSIVE','POTENTIALLY_UNRESOLVED')),
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1), algorithm_version varchar(40) NOT NULL,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_resolution_verifications_submission ON resolution_verifications(submission_id, created_at DESC);
CREATE TABLE resolution_verification_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), verification_id uuid NOT NULL REFERENCES resolution_verifications(id) ON DELETE CASCADE,
  check_type varchar(50) NOT NULL, result varchar(20) NOT NULL CHECK (result IN ('PASS','FAIL','INCONCLUSIVE')),
  confidence numeric(5,4) CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1), evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  algorithm_version varchar(40) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(verification_id, check_type)
);
CREATE INDEX idx_resolution_checks_verification ON resolution_verification_checks(verification_id, check_type);
CREATE TABLE resolution_verification_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), verification_id uuid NOT NULL REFERENCES resolution_verifications(id) ON DELETE CASCADE,
  reviewer_user_id uuid REFERENCES users(id) ON DELETE SET NULL, decision varchar(40) NOT NULL CHECK (decision IN ('APPROVE','REJECT','REQUEST_EVIDENCE')),
  note text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_resolution_reviews_verification ON resolution_verification_reviews(verification_id, created_at DESC);
COMMENT ON TABLE resolution_verifications IS 'Automated evidence assessment; confidence is not proof of resolution.';
