# Backend Build Spec

This file is the execution contract for the backend project in this repository.

Use it as a promptable roadmap. Later, a command like `complete step 5` should mean: implement only Step 5 below, keep previous completed steps intact, and update code/tests/docs needed for that step.

## Project Goal

Build a small NestJS backend for a task management system with:

- JWT authentication
- 2 predefined roles: `ADMIN`, `USER`
- Task CRUD and assignment
- Task status updates
- Audit logging for important actions
- PostgreSQL with Prisma ORM
- Docker-based local setup

## Current Repo Context

- Framework: NestJS 11
- Package manager: `pnpm`
- Runtime: Node.js / TypeScript
- Existing scripts include `build`, `start:dev`, `test`, `test:e2e`, and `lint`
- Database and Prisma are not fully set up yet

## Working Rules For Future Execution

When implementing any step later:

- Only complete the requested step unless the step explicitly depends on unfinished setup from earlier steps
- Preserve existing working behavior
- Add or update tests when the step changes behavior
- Update README or env examples when setup changes
- Prefer clean architecture over shortcuts
- Keep API and schema naming consistent with earlier completed steps

## Suggested Architecture

- `src/modules/auth`
- `src/modules/users`
- `src/modules/tasks`
- `src/modules/audit-logs`
- `src/common`
- `prisma`

Recommended cross-cutting pieces:

- Prisma service/module
- Config module for environment variables
- JWT auth guard
- Role guard
- Current-user decorator
- Global validation pipe
- Centralized error handling where useful

## Core Domain

### Roles

- `ADMIN`
- `USER`

### Task Status

- `PENDING`
- `PROCESSING`
- `DONE`

### Main Entities

#### User

- `id`
- `name`
- `email`
- `password` // hash
- `role`
- `createdAt`
- `updatedAt`

#### Task

- `id`
- `title`
- `description`
- `status`
- `assignedUserId` nullable or required based on chosen design
- `createdAt`
- `updatedAt`
- optional relation fields for Prisma

#### AuditLog

- `id`
- `actorUserId`
- `actionType`
- `targetEntity`
- `targetEntityId`
- `summary`
- `createdAt`

## API Scope

Minimum expected backend endpoints:

- `POST /auth/login`
- `GET /auth/me`
- `GET /users/me/tasks`
- `GET /tasks`
- `GET /tasks/:id`
- `POST /tasks`
- `PATCH /tasks/:id`
- `PATCH /tasks/:id/status`
- `DELETE /tasks/:id`
- `GET /audit-logs`

Behavior expectations:

- Admin can create, update, delete, assign, and view all tasks
- User can view only assigned tasks
- User can update only own assigned task status
- Audit logs should capture task creation, task update, deletion, assignment change, and status change

## Step-by-Step Execution Plan

## ==================== Step 1: Base Infrastructure Setup ====================

### Goal

Prepare the project to run a NestJS backend with PostgreSQL and Prisma in local development.

### Tasks

- Install and configure Prisma and PostgreSQL client dependencies
- Add Prisma initialization files
- Add Docker setup for PostgreSQL and the NestJS app
- Add environment variable structure
- Make sure local app startup path is clear for both Docker and non-Docker development

### Deliverables

- `prisma/schema.prisma`
- `.env` or `.env.example`
- `Dockerfile`
- `docker-compose.yml`
- updated `package.json` scripts if needed
- Prisma/Nest bootstrap wiring if required

### Acceptance Criteria

- PostgreSQL and the NestJS app can run together via Docker Compose
- Prisma can connect to the database
- Project has a documented database connection string
- `pnpm` scripts remain usable

### Prompt Mapping

If asked `complete step 1`, perform setup only. Do not implement auth, tasks, or audit business logic yet.

## ==================== Step 2: Data Modeling With Prisma ====================

### Goal

Define the database schema for users, tasks, and audit logs.

### Tasks

- Create Prisma enums for roles and task status
- Define `User`, `Task`, and `AuditLog` models
- Add relations between users, tasks, and audit logs
- Add timestamps and useful indexes
- Generate initial migration

### Deliverables

- finalized `prisma/schema.prisma`
- Prisma migration files

### Acceptance Criteria

- Schema supports all required product features
- Relations are clean and query-friendly
- Migration runs successfully on a fresh database

### Prompt Mapping

If asked `complete step 2`, implement schema and migrations only.

## ==================== Step 3: Seed Predefined Users ====================

### Goal

Create the required predefined login accounts for one admin and one normal user.

### Tasks

- Add seed script support
- Insert one admin user
- Insert one normal user
- Hash passwords before storing them
- Document demo credentials in a safe local-dev format
- Take demo credentials from the env 

### Deliverables

- Prisma seed file
- seed command in `package.json`
- documented demo credentials in README or dedicated section
- update `.env`

### Acceptance Criteria

- Running the seed on an empty database creates exactly the required starter users
- Passwords are hashed, not stored in plain text

### Prompt Mapping

If asked `complete step 3`, do not build JWT auth yet unless needed for validating seeded users.

## ==================== Step 4: App Foundation And Shared Modules ====================

### Goal

Create the shared backend foundation needed by all feature modules.

### Tasks

- Add Prisma service/module
- Add config loading for env variables
- Add validation setup
- Create shared DTO and guard helpers as needed
- Organize modules into a maintainable folder structure

### Deliverables

- shared infrastructure code in `src`
- app module wiring

### Acceptance Criteria

- App boots with clean module boundaries
- Shared services can be reused by later steps without refactor pressure

### Prompt Mapping

If asked `complete step 4`, focus on internal architecture, not feature endpoints.

## ==================== Step 5: Authentication With JWT ====================

### Goal

Allow predefined users to log in and receive JWT access tokens.

### Tasks

- Add auth module
- Implement login DTO and validation
- Verify user credentials against seeded accounts
- Generate JWT token with user id, email, and role
- Add protected `me` endpoint

### Deliverables

- auth service
- auth controller
- JWT strategy and guard
- login and current-user DTO flow

### Acceptance Criteria

- `POST /auth/login` returns a valid JWT for correct credentials
- Invalid credentials return proper unauthorized response
- `GET /auth/me` returns the authenticated user context

### Prompt Mapping

If asked `complete step 5`, implement the full JWT auth flow for predefined users and add tests for login success/failure.

## ==================== Step 6: Role-Based Access Control ====================

### Goal

Restrict endpoints based on `ADMIN` and `USER` permissions.

### Tasks

- Create role decorator
- Create role guard
- Apply guard rules to relevant endpoints
- Ensure users cannot access admin-only actions

### Deliverables

- reusable RBAC utilities
- endpoint protection integrated into controllers

### Acceptance Criteria

- Admin-only endpoints reject normal users
- Authenticated users can still access allowed endpoints
- Authorization logic is centralized and easy to maintain

### Prompt Mapping

If asked `complete step 6`, do RBAC enforcement without yet implementing all task business logic if that belongs to later steps.

## ==================== Step 7: Admin Task CRUD ====================

### Goal

Allow admins to create, view, update, and delete tasks.

### Tasks

- Build task DTOs for create and update
- Implement task service for CRUD operations
- Add task controller endpoints for admin usage
- Return normalized API responses

### Deliverables

- task module
- admin CRUD endpoints
- relevant unit or e2e tests

### Acceptance Criteria

- Admin can create tasks with title, description, status, and assignment
- Admin can update task details
- Admin can delete tasks
- Validation errors are handled cleanly

### Prompt Mapping

If asked `complete step 7`, implement admin task CRUD only. Audit logging can be deferred unless explicitly required by the step dependency chain.

## ==================== Step 8: User Task Views ====================

### Goal

Allow normal users to view only tasks assigned to them.

### Tasks

- Add endpoint for current user assigned tasks
- Optionally support task detail view for owned tasks
- Prevent access to tasks owned by other users

### Deliverables

- user task query endpoints
- authorization checks for ownership

### Acceptance Criteria

- Normal users only see their assigned tasks
- Users cannot fetch unrelated tasks by id
- Admin behavior remains unaffected

### Prompt Mapping

If asked `complete step 8`, focus on task retrieval for normal users only.

## ==================== Step 9: User Task Status Updates ====================

### Goal

Allow normal users to update the status of tasks assigned to them.

### Tasks

- Add status update DTO
- Implement endpoint for status change
- Enforce ownership checks
- Restrict updates to allowed fields for normal users

### Deliverables

- status update route and service logic
- tests for authorized and unauthorized status changes

### Acceptance Criteria

- User can change status of own assigned task
- User cannot edit title, description, assignment, or delete task through this flow
- User cannot update another user's task

### Prompt Mapping

If asked `complete step 9`, implement only the user status-change flow.

## ==================== Step 10: Audit Logging Core ====================

### Goal

Persist audit entries for all important task-related actions.

### Tasks

- Create audit log service
- Define action types such as `TASK_CREATED`, `TASK_UPDATED`, `TASK_DELETED`, `TASK_ASSIGNED`, `TASK_STATUS_CHANGED`
- Capture actor, target entity, target id, summary
- Integrate audit creation into task operations

### Deliverables

- audit log module/service
- Prisma writes for audit entries
- integration with task flows

### Acceptance Criteria

- Every important task action creates an audit record
- Logs include actor and enough context to understand what changed

### Prompt Mapping

If asked `complete step 10`, implement the audit system and wire it into already existing task flows.

## ==================== Step 11: Audit Log Retrieval For Admin ====================

### Goal

Allow admins to inspect audit log history.

### Tasks

- Create admin-only endpoint to list logs
- Add sorting by newest first
- Optionally add simple filters such as action type or task id if straightforward

### Deliverables

- `GET /audit-logs` endpoint
- DTO/query validation if filters are included

### Acceptance Criteria

- Admin can view audit logs
- Normal users cannot access audit logs
- Response is understandable and useful for traceability

### Prompt Mapping

If asked `complete step 11`, implement audit log read APIs only.

## ==================== Step 12: Testing Coverage ====================

### Goal

Add enough automated testing to validate core flows.

### Tasks

- Add unit tests for important services where useful
- Add e2e tests for login, admin task CRUD, user task access, status updates, and audit logs
- Make tests runnable with documented commands

### Deliverables

- updated `test` files
- any test helpers or fixtures needed

### Acceptance Criteria

- Core happy paths are covered
- Key authorization failures are covered
- Tests can run consistently in local development

### Prompt Mapping

If asked `complete step 12`, prioritize e2e coverage for business-critical flows.

## ==================== Step 13: Dockerized App Runtime ====================

### Goal

Refine the container workflow for evaluation and handoff.

### Tasks

- Improve the existing backend Dockerfile if needed
- Refine `docker-compose.yml` for evaluation convenience
- Ensure database and app startup instructions are correct
- Handle migration/seed startup workflow cleanly
- Optimize image/runtime behavior if necessary

### Deliverables

- Dockerfile
- updated compose configuration
- run instructions

### Acceptance Criteria

- Local setup is clear and reproducible
- `docker compose up` supports the intended developer flow

### Prompt Mapping

If asked `complete step 13`, focus on containerization and run workflow.

## ==================== Step 14: Documentation And Delivery Notes ====================

### Goal

Prepare the repository for handoff and evaluation.

### Tasks

- Update README with setup steps
- Add demo credentials
- Add API summary
- Add notes about architecture decisions
- Add a section for major AI prompts if this workflow is being tracked

### Deliverables

- updated `README.md`
- optional prompt log file if requested

### Acceptance Criteria

- A reviewer can start the project and understand the structure quickly
- Demo credentials and core commands are easy to find

### Prompt Mapping

If asked `complete step 14`, focus on docs and delivery readiness, not core feature code.

## Recommended Build Order

Complete steps in this order:

1. Step 1
2. Step 2
3. Step 3
4. Step 4
5. Step 5
6. Step 6
7. Step 7
8. Step 8
9. Step 9
10. Step 10
11. Step 11
12. Step 12
13. Step 13
14. Step 14

## Definition Of Done For The Whole Backend

The backend is considered complete when:

- Auth works with predefined admin and user accounts
- RBAC is enforced correctly
- Admin can manage tasks
- Users can view assigned tasks and update status
- Audit logs are stored and viewable by admins
- Database schema and migrations are committed
- Tests cover critical flows
- Docker setup works for local evaluation
- README includes setup, commands, and demo credentials

## Execution Note

When I later say something like `complete step 5`, the expected action is:

- inspect current code state
- implement Step 5 only
- keep prior completed steps working
- add/update tests for that step
- briefly report what changed and anything still blocked by unfinished earlier steps
