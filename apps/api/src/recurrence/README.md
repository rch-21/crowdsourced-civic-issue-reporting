# Phase 8 — Recurrence and infrastructure history

Infrastructure profiles are explicit municipal location/asset records. GPS coordinates from reports are not silently promoted into assets.

Recurrence is assessed only across incidents explicitly linked to the same infrastructure profile and related issue category. The configured window and minimum occurrence count determine the candidate. Radius is stored as configuration for future spatial asset matching; the current assessment uses explicit infrastructure identity to avoid conflating nearby but unrelated assets.

A recurrence result is evidence for investigation, not a claim that an asset is defective and not a root-cause conclusion.

## APIs

- `GET /api/v1/infrastructure/:id/history` — asset, incident and intervention timeline.
- `GET /api/v1/recurrence/config` — current recurrence definition.
- `POST /api/v1/infrastructure/:id/incidents/:incidentId` — explicitly link an incident to a known profile.
- `POST /api/v1/infrastructure/:id/recurrence/:categoryId` — calculate and persist category-specific recurrence evidence.
- `POST /api/v1/infrastructure` — create an explicit infrastructure/location profile.
- `POST /api/v1/infrastructure/:id/interventions` — append an intervention to history.

Historical resolved incidents are retained and shown in the timeline.
