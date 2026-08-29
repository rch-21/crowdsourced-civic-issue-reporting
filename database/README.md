# Database

PostgreSQL 16 with PostGIS 3.4 is the persistence layer for the Civic Issue platform.

## Migration order

The Docker initialization mounts `database/migrations` and executes SQL files in lexical order:

1. `001_extensions.sql` — PostGIS and pgcrypto.
2. `002_civic_domain.sql` — relational civic domain model and indexes.
3. `003_seed_reference_data.sql` — baseline roles, severity definitions, departments and taxonomy.
4. `004_seed_permissions.sql` — baseline role/permission mappings.
5. `005_schema_checks.sql` — initialization-time integrity checks.

## Setup

From the repository root:

```powershell
npm run db:up
```

Check the container:

```powershell
docker compose -f database/docker-compose.yml ps
```

The API uses:

```text
postgresql://civic:civic@localhost:55432/civic_issue
```

For a clean schema after changing initialization migrations, remove the development volume first:

```powershell
npm run db:down
docker volume rm civic-issue-platform_civic_issue_pgdata
npm run db:up
```

## Domain notes

- `reports` preserve individual citizen submissions.
- `incidents` represent underlying civic problems and can aggregate many reports.
- PostGIS `Point` columns support distance/nearby queries; `MultiPolygon` columns support ward mapping and affected-area analysis.
- GiST indexes are provided on geographic columns and composite/time indexes cover common operational lookups.
- `infrastructure_profiles` is intentionally minimal and is an extension point only; infrastructure history is deferred.
- No AI-derived, clustering, or scoring state is persisted in this phase.

## Phase 8 — infrastructure and recurrence

`infrastructure_profiles` is an explicit location/asset abstraction. A report GPS point does not create an asset automatically. Known assets may be roads, intersections, drainage locations, public facilities or other municipal locations, represented by a PostGIS `Geometry` so point/line/polygon profiles can be supported.

`infrastructure_incidents` preserves historical incident relationships. `infrastructure_interventions` is append-only history. `recurrence_config` defines minimum occurrences, time window, radius and category policy. `recurrence_assessments` stores evidence, confidence and calculation version.

Recurrence is category-specific: an asset can have many different issue types in its history, but those different categories are not automatically classified as the same recurring issue. No root cause or defect assertion is produced.
