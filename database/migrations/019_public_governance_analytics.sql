-- Phase 15: public-safe governance analytics. No citizen identity/contact/location is exposed.
CREATE OR REPLACE VIEW public_governance_summary AS
SELECT
  (SELECT count(*) FROM reports) AS total_reports,
  (SELECT count(*) FROM incidents) AS total_incidents,
  (SELECT count(*) FROM incidents WHERE status NOT IN ('resolved','closed')) AS active_incidents,
  (SELECT count(*) FROM incidents WHERE status IN ('resolved','closed')) AS resolved_incidents,
  (SELECT count(*) FROM incidents WHERE status='reopened') AS reopened_incidents,
  (SELECT count(*) FROM incidents WHERE sla_due_at IS NOT NULL AND resolved_at IS NOT NULL AND resolved_at <= sla_due_at) AS sla_met,
  (SELECT count(*) FROM incidents WHERE sla_due_at IS NOT NULL AND resolved_at IS NOT NULL) AS sla_measured,
  (SELECT round(avg(EXTRACT(EPOCH FROM (resolved_at-created_at))/3600.0)::numeric,2) FROM incidents WHERE resolved_at IS NOT NULL) AS avg_resolution_hours,
  (SELECT round(avg(rating)::numeric,2) FROM feedback WHERE rating IS NOT NULL) AS citizen_satisfaction,
  (SELECT count(*) FROM incidents WHERE impact_score >= 75) AS high_impact_incidents;

CREATE OR REPLACE VIEW public_ward_statistics AS
SELECT w.id AS ward_id, w.name AS ward_name, w.code AS ward_code,
  count(DISTINCT i.id) AS incident_count,
  count(DISTINCT r.id) AS report_count,
  count(DISTINCT i.id) FILTER (WHERE i.status IN ('resolved','closed')) AS resolved_incident_count,
  round(100.0 * count(DISTINCT i.id) FILTER (WHERE i.status IN ('resolved','closed')) / NULLIF(count(DISTINCT i.id),0),2) AS resolution_rate_pct,
  round(avg(EXTRACT(EPOCH FROM (i.resolved_at-i.created_at))/3600.0) FILTER (WHERE i.resolved_at IS NOT NULL)::numeric,2) AS avg_resolution_hours,
  count(DISTINCT i.id) FILTER (WHERE i.impact_score >= 75) AS high_impact_incidents,
  count(DISTINCT i.id) FILTER (WHERE i.recurrence_count > 0) AS recurring_incidents
FROM wards w LEFT JOIN incidents i ON i.ward_id=w.id LEFT JOIN reports r ON r.ward_id=w.id GROUP BY w.id,w.name,w.code;

CREATE OR REPLACE VIEW public_department_statistics AS
SELECT d.id AS department_id,d.name AS department_name,
 count(DISTINCT i.id) AS incident_count,
 count(DISTINCT i.id) FILTER (WHERE i.status IN ('resolved','closed')) AS resolved_incident_count,
 round(100.0*count(DISTINCT i.id) FILTER (WHERE i.status IN ('resolved','closed'))/NULLIF(count(DISTINCT i.id),0),2) AS resolution_rate_pct,
 round(avg(EXTRACT(EPOCH FROM (i.resolved_at-i.created_at))/3600.0) FILTER (WHERE i.resolved_at IS NOT NULL)::numeric,2) AS avg_resolution_hours,
 count(DISTINCT i.id) FILTER (WHERE i.impact_score >= 75) AS high_impact_incidents
FROM departments d LEFT JOIN incidents i ON i.department_id=d.id GROUP BY d.id,d.name;

CREATE OR REPLACE VIEW public_issue_hotspots AS
SELECT i.category_id,ic.name AS category_name,i.ward_id,w.name AS ward_name,
 count(*) AS incident_count,round(avg(i.impact_score)::numeric,2) AS avg_impact_score,
 count(*) FILTER (WHERE i.recurrence_count>0) AS recurring_incident_count
FROM incidents i JOIN issue_categories ic ON ic.id=i.category_id LEFT JOIN wards w ON w.id=i.ward_id
GROUP BY i.category_id,ic.name,i.ward_id,w.name;

CREATE OR REPLACE VIEW public_resolution_trends AS
SELECT date_trunc('month',created_at) AS month,count(*) AS incidents_created,
 count(*) FILTER (WHERE resolved_at IS NOT NULL) AS incidents_resolved,
 round(avg(EXTRACT(EPOCH FROM (resolved_at-created_at))/3600.0) FILTER (WHERE resolved_at IS NOT NULL)::numeric,2) AS avg_resolution_hours
FROM incidents GROUP BY 1 ORDER BY 1;

COMMENT ON VIEW public_governance_summary IS 'Aggregated public-safe metrics. No citizen identifiers, contacts, or precise personal locations.';
COMMENT ON VIEW public_ward_statistics IS 'Normalized ward performance metrics; report count and incident count remain separate.';
COMMENT ON VIEW public_department_statistics IS 'Aggregated department performance without private citizen data.';
