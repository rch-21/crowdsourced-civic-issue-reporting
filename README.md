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
apps/        deployable applications (web, api)
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

## Local development

See [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) for setup, database, API, citizen app, and administration dashboard instructions.
