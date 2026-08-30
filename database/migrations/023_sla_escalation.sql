-- Phase 20: configurable SLA policy per impact priority, incident due-date tracking, and escalation records.
CREATE TABLE IF NOT EXISTS sla_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  priority varchar(20) NOT NULL UNIQUE CHECK (priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  response_hours integer NOT NULL,
  resolution_hours integer NOT NULL,
  escalation_hours_after_breach integer NOT NULL DEFAULT 24,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO sla_policies(priority,response_hours,resolution_hours,escalation_hours_after_breach) VALUES
 ('CRITICAL',2,24,6),
 ('HIGH',8,72,24),
 ('MEDIUM',24,168,48),
 ('LOW',72,336,96)
ON CONFLICT (priority) DO NOTHING;

ALTER TABLE incidents ADD COLUMN IF NOT EXISTS sla_due_at timestamptz;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS sla_breached_at timestamptz;

CREATE TABLE IF NOT EXISTS incident_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  level integer NOT NULL DEFAULT 1,
  reason varchar(80) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','ACKNOWLEDGED','RESOLVED')),
  triggered_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  acknowledged_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  notes text
);

CREATE INDEX IF NOT EXISTS idx_incidents_sla_due ON incidents(sla_due_at) WHERE status NOT IN ('resolved','closed');
CREATE INDEX IF NOT EXISTS idx_escalations_incident ON incident_escalations(incident_id, status);
CREATE INDEX IF NOT EXISTS idx_escalations_level ON incident_escalations(incident_id, level DESC);

COMMENT ON TABLE sla_policies IS 'Configurable SLA response/resolution windows by impact priority tier. Editable without code changes.';
COMMENT ON COLUMN incidents.sla_due_at IS 'Resolution deadline computed from the incident current impact priority and sla_policies.';
COMMENT ON COLUMN incidents.sla_breached_at IS 'Set the first time the incident is observed past sla_due_at while still open; cleared if resolved before breach.';
COMMENT ON TABLE incident_escalations IS 'Escalation records created when an open incident breaches its SLA; level increases the longer it stays breached.';
