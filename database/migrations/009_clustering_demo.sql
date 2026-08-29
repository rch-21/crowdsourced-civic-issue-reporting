-- Deterministic demo fixture: 50 reports can be associated with one existing incident.
-- This is data-only and intentionally disabled by default; run manually in a development database.
-- Replace the UUID literals below with IDs from your local taxonomy/users before running.

-- Example association shape:
-- INSERT INTO incident_associations (report_id,incident_id,confidence,geographic_score,category_score,description_score,image_score,temporal_score,decision,explanation)
-- SELECT r.id, :incident_id, 0.92, 0.95, 1.0, 0.82, 0.0, 0.90, 'associated',
--        jsonb_build_object('reason','same category, nearby location, overlapping time window')
-- FROM reports r WHERE r.id = ANY(:fifty_report_ids);

COMMENT ON TABLE incident_associations IS 'Supports deterministic demonstration of 50 reports -> 1 incident while retaining all report rows.';
