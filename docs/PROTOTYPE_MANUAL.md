# Civic Issue Reporting Platform
## Prototype Testing Manual

## Overview

The Civic Issue Reporting Platform is a crowdsourced civic problem reporting system.
Citizens can submit issues and administrators can manage and monitor reported problems.

The platform contains:

- Citizen Web Application (`apps/web`)
- Admin Dashboard (`apps/admin`)
- Backend API (`apps/api`)

## Live Prototype

Citizen Application:

https://web-j04pivw5q-apex-deploy.vercel.app

Admin Dashboard:

https://admin-apex-deploy.vercel.app

Backend API:

https://brilliant-acceptance-production-f41d.up.railway.app

## Demo Credentials

### Administrator Account

Email:

```
administrator@gmail.com
```

Password:

```
administrator123
```

Role:

```
Administrator
```

### Citizen/User Account

Users can create their own account using any valid email and password.

Example:

Email:
```
testuser@gmail.com
```

Password:
```
testuser123
```

## Testing Steps

1. Open the Citizen Application.
2. Register a new citizen account.
3. Login and create a civic issue report.
4. Open the Admin Dashboard.
5. Login using the administrator credentials.
6. Review submitted issues.

## Recent Platform Updates

- Fixed Railway API deployment configuration.
- Fixed backend startup process.
- Added database migrations and PostGIS support.
- Added role-based accounts.
- Improved API validation and error handling.
