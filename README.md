# crowdsourced-civic-issue-reporting

Crowdsourced Civic Issue Reporting and Resolution System — SIH 2025.

## Overview

A civic reporting platform where citizens can submit issues with location,
photos, voice notes, and descriptions. Municipal administrators can review,
prioritize, resolve, and analyse reported issues.

## Stack

- Frontend: React 19 + Vite + TypeScript
- Backend: Node.js 24 + Fastify 5 + TypeScript
- Database: PostgreSQL 16 + PostGIS 3.4
- Validation: Zod
- Logging: Fastify/Pino
- Testing: Vitest
- Monorepo: npm workspaces

## Applications

- `apps/web/` — citizen-facing application
- `apps/admin/` — municipal administration dashboard
- `apps/api/` — Fastify API and business services

## Local development

Docker is recommended for local development because it provides the required database infrastructure.

See [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) for developer setup instructions.


## Production usage

End users do not need Docker. A deployed version is accessed through a web browser.

Production deployments require:

- hosted PostgreSQL/PostGIS database
- deployed API service
- deployed citizen web application
- deployed administration dashboard

For operators, configure production environment variables before starting services.

## User documentation

- [Citizen User Guide](docs/USER_GUIDE.md)
- [Administrator Guide](docs/ADMIN_GUIDE.md)

## Demo Credentials

For prototype testing, use the following administrator account:

**Admin Dashboard:**
https://admin-apex-deploy.vercel.app

Email:
```
administrator@gmail.com
```

Password:
```
administrator123
```

Citizen users can register and login using any valid credentials from the user application:

https://web-j04pivw5q-apex-deploy.vercel.app

## Prototype Testing Manual

A complete testing guide is available here:

[Prototype Testing Manual](docs/PROTOTYPE_MANUAL.md)
