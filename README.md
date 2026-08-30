# crowdsourced-civic-issue-reporting

Crowdsourced Civic Issue Reporting and Resolution System — SIH 2025.

## Stack

- Frontend: React 19 + Vite + TypeScript
- Backend: Node.js 24 + Fastify 5 + TypeScript
- Database: PostgreSQL 16 + PostGIS 3.4 via Docker
- Validation: Zod
- Logging: Fastify/Pino
- Testing: Vitest
- Monorepo: npm workspaces

## Structure

```text
apps/        deployable applications (citizen web, admin web, api)
packages/    shared contracts and models
services/    independent service boundaries
 database/   PostgreSQL/PostGIS infrastructure and migrations
config/      configuration guidance
 tests/      cross-application tests
 docs/       architecture and development documentation
```

## Applications

- `apps/admin/` — municipal administration dashboard
- `apps/web/` — citizen and municipal web application
- `apps/api/` — Fastify API and business services

The citizen app supports report tracking, GPS-tagged problem photos, nearby-issue detection, and upvoting. The administration app supports acknowledgement, impact-based triage, resolution proof, citizen approval, and historical analysis.

## Local development

See [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) for setup, database, API, citizen app, and administration dashboard instructions.


## User Documentation

Guides for operating the system:

- [Citizen User Guide](docs/USER_GUIDE.md)
- [Administrator Guide](docs/ADMIN_GUIDE.md)
