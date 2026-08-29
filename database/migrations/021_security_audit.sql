-- Phase 17: append-only audit trail and abuse controls.
CREATE TABLE IF NOT EXISTS audit_log (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
 action varchar(100) NOT NULL, entity_type varchar(80), entity_id uuid, request_id varchar(100), ip_address inet,
 user_agent text, details jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity_time ON audit_log(entity_type,entity_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor_time ON audit_log(actor_user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS abuse_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE SET NULL,
 event_type varchar(80) NOT NULL, fingerprint varchar(255), details jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_abuse_user_time ON abuse_events(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abuse_fingerprint_time ON abuse_events(fingerprint,created_at DESC);
REVOKE UPDATE,DELETE ON audit_log FROM PUBLIC;
COMMENT ON TABLE audit_log IS 'Append-only operational audit trail. Application roles should grant INSERT/SELECT only as appropriate.';
