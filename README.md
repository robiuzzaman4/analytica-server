# Analytica Management Backend

NestJS backend for the task management system described in `doc.md`.

## Current Progress

- Step 1: infrastructure setup completed
- Step 2: Prisma schema and initial migration added
- Step 3: local seed support for demo users added

## Requirements

- Node.js 20+
- pnpm
- local PostgreSQL

## Environment Setup

1. Copy `.env.example` to `.env`
2. Create a local PostgreSQL database named `analytica_task_management_db`
3. Update DB credentials in `.env` if your local PostgreSQL uses different ones

Example:

```bash
cp .env.example .env
```

If you are on Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

## Local Database

The local development database is expected to be:

- database: `analytica_task_management_db`
- user: `postgres`
- password: `123456`

If your local PostgreSQL credentials differ, update `DATABASE_URL` in `.env`.

## Prisma Commands

Validate the Prisma schema:

```bash
pnpm run prisma:validate
```

Generate the Prisma client:

```bash
pnpm run prisma:generate
```

Run the Prisma seed:

```bash
pnpm run db:seed
```

## Demo Credentials

The seed uses values from `.env`:

- `DEMO_ADMIN_NAME`
- `DEMO_ADMIN_EMAIL`
- `DEMO_ADMIN_PASSWORD`
- `DEMO_USER_NAME`
- `DEMO_USER_EMAIL`
- `DEMO_USER_PASSWORD`

Default local demo accounts:

- admin: `admin@analytica.local` / `Admin123!`
- user: `user@analytica.local` / `User123!`

Passwords are hashed before being stored in the database.

## Run The App

Install dependencies:

```bash
pnpm install
```

Start the backend in development mode:

```bash
pnpm run start:dev
```
