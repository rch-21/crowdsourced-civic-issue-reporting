# Civic Issue — Local Development Guide

## 1. Prerequisites

- Windows 10/11
- Node.js 24.x (the verified machine has Node v24.19.0)
- npm 11.x (verified: 11.17.0)
- Docker Desktop with the Linux engine running
- Git 2.x (recommended for version control)

## 2. Stack

Frontend: React 19 + Vite 7 + TypeScript.
Backend: Node.js + Fastify 5 + TypeScript.
Database: PostgreSQL 16 + PostGIS 3.4.
Validation: Zod. Logging: Pino/Fastify. Tests: Vitest. Package manager: npm workspaces.

## 3. Environment

API development variables are in `apps/api/.env.development.example`:

- NODE_ENV — optional; development default
- HOST — optional; defaults to 0.0.0.0
- PORT — optional; defaults to 4000
- LOG_LEVEL — optional; defaults to info
- DATABASE_URL — optional; defaults to the local Docker database URL
- CORS_ORIGINS — optional comma-separated browser origins; defaults to http://localhost:5173,http://localhost:5175
- BODY_LIMIT — optional maximum JSON request size in bytes; defaults to 12000000 for resolution photo evidence

The web app optionally reads `VITE_API_BASE_URL`; if omitted it uses `http://localhost:4000/api/v1`.
No external API keys are currently referenced by application source. Notification adapters are console/dev adapters.

No root `.env.example` is required by the current code. For direct API execution, copy the development example to `apps/api/.env`.

## 4. Database

Docker Compose provides the database and PostGIS:

```powershell
cd "C:\Users\hp\OneDrive\Desktop\Civic Issue"
npm run db:up
```

The compose file creates database `civic_issue`, user `civic`, password `civic`, on localhost:55432 (mapped to PostgreSQL’s container port 5432). SQL migrations are mounted into `/docker-entrypoint-initdb.d` and run in lexical order on first database initialization.

Check:

```powershell
docker compose -f database/docker-compose.yml ps
```

For a clean development database after migration changes:

```powershell
npm run db:down
docker volume rm civic-issue-platform_civic_issue_pgdata
npm run db:up
```

There is no separate Redis, AI server, map server, or notification provider required by the current local implementation. Citizen problem photos are stored in the prototype database metadata; production should use object storage instead.

## 5. Install

From the repository root:

```powershell
npm install
```

Dependencies are already present in the inspected working copy.

## 6. Start backend

```powershell
npm run dev:api
```

API: `http://localhost:4000`
Health endpoint: `http://localhost:4000/api/v1/health`

## 7. Start frontend

In a second PowerShell window:

```powershell
cd "C:\Users\dhara\OneDrive\Desktop\Civic Issue"
npm run dev:web
```

Open `http://localhost:5173`.

In another PowerShell window, start the administration dashboard:

```powershell
cd "C:\Users\hp\OneDrive\Desktop\Civic Issue"
npm run dev:admin
```

Open `http://localhost:5175`.

Or start both:

```powershell
npm run dev
```

## 8. Demo accounts

The migrations do not contain seeded user accounts. Do not use real credentials. For local role-based testing, run `node scripts/seed-dev-users.mjs` after starting the API; it prints temporary demo credentials and verifies each role. The administrator console accepts administrator and supervisor accounts only.

## 9. Verification commands

Run the complete automated suite:

```powershell
npm test
```

Build everything:

```powershell
npm run build
```

Type-check/lint where configured:

```powershell
npm run lint
```

Verify the API manually:

```powershell
Invoke-RestMethod http://localhost:4000/api/v1/health
```

A healthy configured database should produce a successful health response. The automated health test intentionally covers the database-unavailable condition too, so a 503 in that test is not itself a test failure.

## 10. Verification status

Run the verification commands in section 9 after starting Docker and the API. The current application includes automated API tests, TypeScript checks, citizen/admin Vite applications, report clustering/upvoting, photo/GPS validation, notifications, resolution approval, and administrator History.

## Shortest startup sequence

Start Docker Desktop and wait until its engine is running, then:

```powershell
cd "C:\Users\hp\OneDrive\Desktop\Civic Issue"
npm install
npm run db:up
npm run dev
```

Then open `http://localhost:5173`.
