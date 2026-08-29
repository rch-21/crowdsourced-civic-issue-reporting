# Civic Issue Platform

Phase 1 establishes the runnable technical foundation for the future civic platform.

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

## Phase 1 scope

Only foundation concerns are implemented: API versioning, health checks, database connectivity, logging, security middleware, error handling, validation configuration, frontend shell, shared types, environment separation, and tests.
