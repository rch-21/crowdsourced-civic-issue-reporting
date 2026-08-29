-- Phase 7: incident is the municipal operational work unit; reports remain citizen records.
CREATE INDEX idx_incidents_operational_queue ON incidents(status, department_id, ward_id, created_at DESC);
CREATE INDEX idx_assignments_active_incident ON assignments(incident_id, status, assigned_at DESC);
CREATE INDEX idx_assignments_officer_active ON assignments(assignee_user_id, status, assigned_at DESC);

COMMENT ON COLUMN incidents.status IS 'Authoritative municipal operational workflow status for the physical civic problem.';
COMMENT ON COLUMN reports.work_status IS 'Citizen-report lifecycle status; supporting reports may retain distinct statuses while their incident has one operational status.';
COMMENT ON TABLE assignments IS 'Operational assignment belongs to an incident in Phase 7; report assignments remain supported for backward compatibility.';
COMMENT ON TABLE incident_history IS 'Operational audit trail for incident workflow, assignment and evidence events.';
