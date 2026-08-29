CREATE TYPE report_work_status AS ENUM ('REPORTED','ACKNOWLEDGED','ASSIGNED','IN_PROGRESS','PENDING_VERIFICATION','RESOLVED','CONFIRMED','REOPENED','FLAGGED');

ALTER TABLE reports ADD COLUMN work_status report_work_status NOT NULL DEFAULT 'REPORTED';

CREATE TABLE report_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  from_status report_work_status,
  to_status report_work_status NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE report_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  author_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE report_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value smallint NOT NULL DEFAULT 1 CHECK (value = 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, user_id)
);

CREATE TABLE report_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE report_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
  type varchar(80) NOT NULL,
  title varchar(200) NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE report_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  uploaded_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  storage_key text NOT NULL UNIQUE,
  media_type varchar(120) NOT NULL,
  file_size bigint CHECK (file_size IS NULL OR file_size >= 0),
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_report_status_history_report_time ON report_status_history(report_id, created_at DESC);
CREATE INDEX idx_report_comments_report_time ON report_comments(report_id, created_at DESC);
CREATE INDEX idx_report_votes_report ON report_votes(report_id);
CREATE INDEX idx_report_feedback_report ON report_feedback(report_id);
CREATE INDEX idx_report_notifications_user_unread ON report_notifications(user_id, read_at, created_at DESC);
CREATE INDEX idx_report_evidence_report ON report_evidence(report_id, created_at DESC);
CREATE INDEX idx_reports_work_status_time ON reports(work_status, reported_at DESC);
CREATE INDEX idx_reports_citizen_status_time ON reports(citizen_id, work_status, reported_at DESC);
