# Incident-centric municipal workflow

## Domain rule

A citizen **report** is the original submission and remains independently identifiable. An **incident** is the municipal operational work unit representing the underlying physical/public problem. Multiple reports can support one incident.

Incident status is authoritative for municipal operational workflow. Report `work_status` remains the citizen-report lifecycle and is not required to be identical to incident status. This avoids forcing one operational state onto every citizen submission while giving officers one workflow for the physical problem.

## Workflow

Citizen reports -> clustering -> incident -> impact score -> supervisor queue -> incident assignment -> officer work -> resolution evidence -> incident resolution.

Phase 7 deliberately does not implement automated verification, recurrence intelligence, root-cause intelligence, cross-department intelligence or resource optimization.

## API

- `GET /api/v1/incidents/queue` — officer/supervisor/admin operational queue, impact-first.
- `GET /api/v1/incidents/:id` — incident detail with supporting reports, assignments and history.
- `PATCH /api/v1/incidents/:id/status` — controlled incident state transition.
- `POST /api/v1/incidents/:id/assign` — supervisor/admin assignment to officer/team.
- `GET /api/v1/officers/me/incidents` — officer's active incident workload.

Private citizen identity is not returned by the incident detail query; it exposes only a `hasCitizen` indicator and aggregate supporting-citizen counts.
