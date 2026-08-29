# Phase 9 — Root-cause intelligence

This module detects cross-issue patterns and creates **possible root-cause hypotheses**. It does not establish causality, declare infrastructure defective, or dispatch municipal resources.

## Observed data vs inference

Observed data is persisted in the linked incident records: category, timestamp, infrastructure relationship, location, severity and history. The hypothesis stores derived categories, confidence, detection method and an explicit evidence note so reviewers can distinguish model inference from observations.

The current detector is deterministic rather than an external AI model. It uses configurable incident count, category diversity, time window and spatial/infrastructure context. No environmental dataset is invented when one is unavailable.

## Review

Supervisors and administrators can review a hypothesis as `accepted`, `rejected`, or `requires_investigation` and add notes. Acceptance records human review; it does not convert the hypothesis into a confirmed root cause.

## API

- `GET /api/v1/root-cause/hypotheses`
- `GET /api/v1/root-cause/hypotheses/:id`
- `POST /api/v1/infrastructure/:id/root-cause-analysis`
- `PATCH /api/v1/root-cause/hypotheses/:id/review`
- `GET /api/v1/root-cause/config`
