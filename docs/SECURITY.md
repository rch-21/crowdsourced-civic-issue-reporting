# Phase 17 Security Review

## Findings and fixes

- Passwords use Node scrypt with per-password random salts and timing-safe verification.
- Sessions use opaque random bearer tokens; only SHA-256 token hashes are stored; sessions expire and can be revoked.
- Verification and password-reset tokens are opaque, hashed at rest, expiring and single-use.
- API payloads use Zod validation on sensitive routes; global security headers are enabled through Helmet.
- A bounded in-process request rate limiter is enabled as a development/default abuse-control layer. Production deployments should place a distributed limiter at the edge for multi-instance consistency.
- Responses receive no-store, nosniff, referrer and permissions-policy headers.
- Audit logging is append-oriented in the schema and normal users have no UPDATE/DELETE privileges on the table.
- Public incident APIs return aggregate/public incident fields and omit citizen identity/contact data.
- Role checks remain backend-enforced; officer assignment is restricted to supervisor/administrator routes and incident workflow restrictions remain server-side.

## Remaining deployment requirements

- Use TLS at the reverse proxy/load balancer and never expose bearer tokens over plaintext HTTP.
- Use a managed/distributed rate limiter (for example Redis-backed) when multiple API instances run.
- Configure object/media storage as private by default, with short-lived authorized access URLs; validate MIME/type and byte size at the upload boundary before enabling production media ingestion.
- Configure PostgreSQL application roles so audit_log is INSERT/SELECT only for the application and migrations are run by a separate owner role.
- Configure CORS to an explicit production allow-list rather than a wildcard.
- Add real OTP provider throttling and delivery controls when an OTP provider is introduced.

## Privacy posture

Citizen GPS/address data remains private application data. Public endpoints should expose only deliberately approved fields. Do not use location data for invasive tracking or surveillance.
