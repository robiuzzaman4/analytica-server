# Analytica Management Backend

NestJS backend for the task management system described in `doc.md`.

## Step 1 Status

Step 1 is focused on infrastructure only:

- NestJS app scaffold
- PostgreSQL via Docker Compose
- backend app container via Docker Compose
- Prisma initialization
- environment variable setup

Domain models, authentication, RBAC, tasks, and audit logging are intentionally deferred to later steps in `spec.md`.

## Requirements

- Node.js 20+
- pnpm
- Docker Desktop

## Environment Setup

1. Copy `.env.example` to `.env`
2. Keep the default `DATABASE_URL` unless you want a different local database name or password

Example:

```bash
cp .env.example .env
```

If you are on Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

## Run With Docker Compose

To run both the database and backend app:

```bash
pnpm run docker:up
```

This starts:

- PostgreSQL on `localhost:5432`
- NestJS backend on `localhost:3000`

To stop everything:

```bash
pnpm run docker:down
```

## Start PostgreSQL Only

```bash
pnpm run docker:up:db
```

This starts PostgreSQL on `localhost:5432` with:

- database: `analytica_management`
- user: `postgres`
- password: `postgres`

To stop it:

```bash
pnpm run db:down
```

## Prisma Commands

Validate the Prisma setup:

```bash
pnpm run prisma:validate
```

Generate the Prisma client:

```bash
pnpm run prisma:generate
```

## Run The App

Install dependencies:

```bash
pnpm install
```

Start the backend in development mode:

```bash
pnpm run start:dev
```

The app listens on the port from `PORT`, defaulting to `3000`.

## Current Database Scope

`prisma/schema.prisma` currently includes only the Prisma generator and PostgreSQL datasource.

The full schema for users, tasks, roles, statuses, and audit logs belongs to Step 2.
