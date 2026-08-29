# Civic Impact Scoring

Phase 6 provides transparent decision-support prioritization. It does not dispatch resources.

## Pipeline

Incident -> feature extraction -> factor normalization -> configurable weighted score -> priority -> confidence/explanation.

Factors include severity, safety, estimated population, location importance, duration, recurrence, confirmations and support volume. Complaint volume is only one factor.

Population is an estimate. The service never fabricates missing population or traffic data. Confidence is reduced when external inputs are unavailable.

## API

- `GET /api/v1/incidents/impact/ranked` — supervisor/admin/officer ranked incidents.
- `GET /api/v1/incidents/:id/impact` — calculate and persist the latest score.
- `GET /api/v1/impact/config` — inspect scoring weights.
- `POST /api/v1/incidents/:id/population-estimate` — persist an explicitly supplied estimate from available data.
- `GET /api/v1/incidents/:id/population-estimate` — latest estimate.

## Sample scenario

The unit tests demonstrate that five high-severity/safety reports with a large affected population can outrank one hundred low-impact reports because support volume has limited weight and safety/population have larger weights.

For production, location importance, recurrence and population inputs should be populated from verified municipal datasets as those integrations become available.
