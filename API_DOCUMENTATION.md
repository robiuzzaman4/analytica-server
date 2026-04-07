# API Documentation

This document is for frontend integration with the backend service.

## Base URL

- Local base URL: `http://localhost:5000/api/v1`
- All routes below are relative to `/api/v1`

## Authentication

The API uses JWT bearer authentication.

- Header: `Authorization: Bearer <accessToken>`
- Get the token from `POST /auth/login`

## Roles

- `ADMIN`
- `USER`

Some endpoints are restricted by role. The role is included in the login response and in `GET /auth/me`.

## Enums

### `TaskStatus`

- `PENDING`
- `PROCESSING`
- `DONE`

### `AuditActionType`

- `TASK_CREATED`
- `TASK_UPDATED`
- `TASK_DELETED`
- `TASK_ASSIGNED`
- `TASK_STATUS_CHANGED`

## Common Notes

- Success responses are JSON.
- Validation errors return `400 Bad Request`.
- Invalid login returns `401 Unauthorized`.
- Missing or invalid token returns `401 Unauthorized`.
- Valid token with wrong role returns `403 Forbidden`.
- When a resource is not found, the API returns `404 Not Found`.

## Health

### `GET /health`

Used for service health checks.

Response:

```json
{
  "status": "ok"
}
```

## Auth

### `POST /auth/login`

Login with email and password.

Request body:

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "accessToken": "<jwt-token>",
  "user": {
    "id": "cm...",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

### `GET /auth/me`

Returns the authenticated user from the JWT.

Auth:

- Any authenticated user

Response:

```json
{
  "id": "cm...",
  "name": "Admin User",
  "email": "admin@example.com",
  "role": "ADMIN"
}
```

Cookie behavior:

- Successful login also sets an `httpOnly` cookie named `accessToken`
- The backend accepts JWTs from either:
  - `Authorization: Bearer <token>`
  - browser cookie `accessToken`

## Tasks

## Admin Task Endpoints

These endpoints require `ADMIN` role.

### `POST /tasks`

Create a task.

Request body:

```json
{
  "title": "Prepare report",
  "description": "Prepare weekly analytics report",
  "status": "PENDING",
  "assignedUserId": "cm..."
}
```

Notes:

- `status` is optional. Default is `PENDING`.
- `assignedUserId` is optional.

Response:

```json
{
  "id": "cm...",
  "title": "Prepare report",
  "description": "Prepare weekly analytics report",
  "status": "PENDING",
  "assignedUserId": "cm...",
  "createdAt": "2026-04-07T10:00:00.000Z",
  "updatedAt": "2026-04-07T10:00:00.000Z",
  "assignedUser": {
    "id": "cm...",
    "name": "Regular User",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

### `GET /tasks`

Get all tasks.

Response:

- Array of task objects
- Ordered by `createdAt` descending

### `GET /tasks/:id`

Get a single task by id.

Response:

- Same task object shape as `POST /tasks`

### `PATCH /tasks/:id`

Update a task.

Request body:

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "PROCESSING",
  "assignedUserId": "cm..."
}
```

Notes:

- All fields are optional.
- `assignedUserId` can be `null` to unassign the task.

Response:

- Same task object shape as `POST /tasks`

### `DELETE /tasks/:id`

Delete a task.

Response:

- Returns the deleted task object

## User Task Endpoints

These endpoints require `USER` role.

### `GET /tasks/me`

Get tasks assigned to the current user.

Response:

- Array of task objects
- Ordered by `createdAt` descending

### `GET /tasks/me/:id`

Get a single assigned task by id.

Response:

- Same task object shape as `POST /tasks`

Important:

- Users can only access tasks assigned to themselves.
- If the task is not assigned to the current user, the API returns `404`.

### `PATCH /tasks/:id/status`

Update the current user's assigned task status.

Request body:

```json
{
  "status": "DONE"
}
```

Response:

- Same task object shape as `POST /tasks`

Important:

- Only `status` can be changed through this endpoint.
- Users cannot update title, description, or assignment here.
- Users can only update tasks assigned to themselves.

## Users

### `GET /users`

Get all users.

Auth:

- `ADMIN` only

Response:

```json
[
  {
    "id": "cm...",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "ADMIN",
    "createdAt": "2026-04-07T10:00:00.000Z",
    "updatedAt": "2026-04-07T10:00:00.000Z"
  }
]
```

Note:

- Passwords are never returned.

## Audit Logs

### `GET /audit-logs`

Get audit logs.

Auth:

- `ADMIN` only

Query params:

- `actionType` optional
- `targetEntityId` optional

Example:

- `/audit-logs?actionType=TASK_CREATED`
- `/audit-logs?targetEntityId=cm123`

Response:

```json
[
  {
    "id": "cm...",
    "actorUserId": "cm...",
    "actionType": "TASK_CREATED",
    "targetEntity": "TASK",
    "targetEntityId": "cm...",
    "summary": "Task \"Prepare report\" created",
    "createdAt": "2026-04-07T10:00:00.000Z",
    "actorUser": {
      "id": "cm...",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "ADMIN"
    }
  }
]
```

## Demo Accounts

The app seeds demo users on startup if they do not already exist. Actual values come from environment variables:

- `DEMO_ADMIN_EMAIL`
- `DEMO_ADMIN_PASSWORD`
- `DEMO_USER_EMAIL`
- `DEMO_USER_PASSWORD`

Frontend developers can use those credentials for local testing.

## Quick Integration Flow

1. Call `POST /auth/login`.
2. Store `accessToken`.
3. Send `Authorization: Bearer <token>` on protected requests.
4. Use the returned `user.role` to decide which UI flows to show.
5. Admin UI should use:
   - `/tasks`
   - `/users`
   - `/audit-logs`
6. User UI should use:
   - `/tasks/me`
   - `/tasks/me/:id`
   - `/tasks/:id/status`
