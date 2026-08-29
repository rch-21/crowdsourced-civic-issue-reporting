# Architecture Foundation

The repository is organized as a modular monorepo so future applications and services can evolve independently while sharing stable contracts.

## Runtime boundaries

- `apps/web`: browser client boundary.
- `apps/api`: HTTP/API boundary and application orchestration.
- `packages/shared`: small cross-runtime types and constants.
- `database`: PostgreSQL/PostGIS infrastructure and migrations.
- `services/intelligence`: reserved service boundary for future intelligence workloads.

## API

All API endpoints are versioned under `/api/v1`. Cross-cutting concerns are registered centrally in the API bootstrap: security headers, CORS, logging, and error handling.

## Configuration

Runtime settings are environment-driven and validated at startup with Zod. Development and production examples are maintained separately; secrets remain outside source control.

## Database

PostgreSQL/PostGIS is provided through Docker Compose for reproducible local development. The API uses a connection pool and exposes database state through the health endpoint.
