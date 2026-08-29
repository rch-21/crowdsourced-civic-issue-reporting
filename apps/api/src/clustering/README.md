# Duplicate detection and clustering

Phase 5 uses an explainable, deterministic multi-signal candidate engine. It is not an ML model and does not silently merge reports.

Signals:

- geographic proximity via PostGIS distance
- category equality
- token-based description similarity
- temporal proximity
- image similarity placeholder scored as 0 until image fingerprints are available

The combined confidence uses configurable weights and thresholds stored in `clustering_config`.

Candidates above the configured confidence and category requirement are marked `associated`; lower-confidence candidates remain `suggested` for human review. A supervisor or administrator can explicitly associate, unlink, or split a candidate through the API.

Reports are never deleted. Association updates only `reports.incident_id` and preserves the original submission.

## Endpoints

- `GET /api/v1/clustering/reports/:id/candidates`
- `GET /api/v1/clustering/config`
- `GET /api/v1/incidents/:id/cluster`
- `POST /api/v1/incidents/:incidentId/cluster-associations/:associationId/decision`

## Demo

`database/migrations/009_clustering_demo.sql` documents the deterministic 50-reports-to-one-incident fixture pattern. It is intentionally not auto-executed because it needs real local UUIDs.
