# Analytica Server

NestJS backend for a small task management system with JWT auth, role-based access control, task management, and audit logging.

Full API reference: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Features

- JWT login with predefined demo users
- Common API response envelope for success and error responses
- 2 roles: `ADMIN` and `USER`
- Admin task CRUD
- User-only assigned task views
- User-only task status updates for owned tasks
- Admin-only user listing
- Admin-only audit log listing
- Audit log filtering by `actionType`
- Offset-based pagination on `GET /tasks`, `GET /tasks/me`, and `GET /audit-logs`
- Prisma ORM with PostgreSQL
- Automatic demo-user seeding on server startup if users do not exist
- CORS enabled for frontend integration

## Tech Stack

- NestJS
- TypeScript
- PostgreSQL
- Prisma
- JWT auth
- Bcrypt
- Jest

## Implemented API

All HTTP responses are wrapped in this format:

```ts
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  statusCode: number;
}
```

For error responses, `success` is `false` and `data` is `null`.

### Auth

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

Notes:

- login returns the JWT in the response body
- login also sets an `accessToken` httpOnly cookie for browser clients
- protected routes accept either `Authorization: Bearer <token>` or the `accessToken` cookie

### Health

- `GET /health`

### Tasks

- `POST /tasks` - admin only
- `GET /tasks` - admin only
- `GET /tasks/:id` - admin only
- `PATCH /tasks/:id` - admin only
- `DELETE /tasks/:id` - admin only
- `GET /tasks/me` - user only, paginated
- `GET /tasks/me/:id` - user only
- `PATCH /tasks/:id/status` - user only

### Users

- `GET /users` - admin only

### Audit Logs

- `GET /audit-logs` - admin only
  Optional query params:
  - `actionType`
  - `targetEntityId`
  - `page`
  - `limit`

Pagination defaults:

- `page=1`
- `limit=20`

## Roles

### Admin

- Log in
- View own profile
- Create, update, assign, and delete tasks
- View all tasks
- View all users
- View audit logs

### User

- Log in
- View own profile
- View only assigned tasks
- Update only the status of assigned tasks

## Demo Credentials

These come from `.env` / `.env.example`.

- Admin: `admin@analytica.local` / `Admin123!`
- User 1: `user@analytica.local` / `User123!`
- User 2: `other@analytica.local` / `Other123!`

## Environment

Copy `.env.example` to `.env`.

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Default local values:

```env
POSTGRES_DB=analytica_task_management_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=123456
POSTGRES_PORT=5432
PORT=5000
DATABASE_URL="postgresql://postgres:123456@localhost:5432/analytica_task_management_db?schema=public"
JWT_SECRET="change-me-later"
DEMO_ADMIN_NAME="Admin User"
DEMO_ADMIN_EMAIL="admin@analytica.local"
DEMO_ADMIN_PASSWORD="Admin123!"
DEMO_USER_NAME="Normal User"
DEMO_USER_EMAIL="user@analytica.local"
DEMO_USER_PASSWORD="User123!"
DEMO_USER_TWO_NAME="Other User"
DEMO_USER_TWO_EMAIL="other@analytica.local"
DEMO_USER_TWO_PASSWORD="Other123!"
```

## Run Locally

### Option 1: Local PostgreSQL

1. Install dependencies

```bash
pnpm install
```

2. Make sure PostgreSQL is running and create a database named `analytica_task_management_db`

3. Copy `.env.example` to `.env` and adjust `DATABASE_URL` if needed

4. Generate Prisma client

```bash
pnpm run prisma:generate
```

5. Apply database migrations

```bash
pnpm exec prisma migrate dev
```

6. Start the app

```bash
pnpm run start:dev
```

Verified working:

- `pnpm start:dev`
- `pnpm docker:up`

The server will:

- start on the configured `PORT`
- enable CORS
- auto-create the demo admin and both demo users if they do not already exist

### Option 2: Docker Compose

```bash
pnpm run docker:up
```

This starts:

- PostgreSQL on `localhost:5432`
- the NestJS app on `localhost:5000`

You can also run the same flow with `docker compose up --build` directly if you prefer.

The compose setup now:

- uses values from `.env` / `.env.example` instead of hardcoded DB credentials
- builds a simple production-style app image
- points the app container to the `postgres` service automatically
- runs `prisma migrate deploy` before starting the app container

Useful env values for Docker:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`
- `PORT`

For local non-Docker development, keep `DATABASE_URL` pointing to `localhost`.
For Docker Compose, the app container internally uses the `postgres` hostname automatically.

## Production Notes

The `Dockerfile` now uses a simple two-stage build:

- `builder` installs dependencies, generates Prisma client, builds the app, and prunes dev dependencies
- `production` copies the built output and production dependencies, then starts `node dist/main`

For Docker-based deployment, the container startup command should run:

```bash
pnpm exec prisma migrate deploy && node dist/main.js
```

That keeps one image usable for both Docker Compose development and production deployment.

For production deployment, provide these env vars at minimum:

- `DATABASE_URL`
- `JWT_SECRET`
- `DEMO_ADMIN_NAME`
- `DEMO_ADMIN_EMAIL`
- `DEMO_ADMIN_PASSWORD`
- `DEMO_USER_NAME`
- `DEMO_USER_EMAIL`
- `DEMO_USER_PASSWORD`
- `DEMO_USER_TWO_NAME`
- `DEMO_USER_TWO_EMAIL`
- `DEMO_USER_TWO_PASSWORD`

## Prisma / Seed Commands

Generate Prisma client:

```bash
pnpm run prisma:generate
```

Validate Prisma schema:

```bash
pnpm run prisma:validate
```

Run seed manually:

```bash
pnpm run db:seed
```

## Testing

Run unit tests:

```bash
pnpm test
```

Run e2e tests:

```bash
pnpm run test:e2e
```

Current verified status:

- `pnpm test` passes
- `pnpm run test:e2e` passes
- `pnpm start:dev` works
- `pnpm docker:up` works

Run lint:

```bash
pnpm run lint
```

## Project Structure

```text
src/
  common/
    auth/
    config/
    prisma/
    seed/
  modules/
    auth/
    tasks/
    users/
    audit-logs/
prisma/
  schema.prisma
  migrations/
  seed.ts
```

## Notes

- Audit logs store actor, action type, target, summary, and timestamp
- Audit log list responses are filtered and paginated, and task list responses are paginated
- Demo users are not recreated on every startup; only missing users are inserted
