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

- All API responses use a shared envelope:

```json
{
  "success": true,
  "message": "Request successful",
  "data": {},
  "statusCode": 200
}
```

- On errors, `success` is `false` and `data` is `null`.
- `statusCode` in the body matches the actual HTTP status code.
- Validation errors return `400 Bad Request`.
- Invalid login returns `401 Unauthorized`.
- Missing or invalid token returns `401 Unauthorized`.
- Valid token with wrong role returns `403 Forbidden`.
- When a resource is not found, the API returns `404 Not Found`.

### Common Task Shape

Task endpoints return this task object inside `data`:

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

## Health

### `GET /health`

Used for service health checks.

Response:

```json
{
  "success": true,
  "message": "Health check retrieved successfully",
  "data": {
    "status": "ok"
  },
  "statusCode": 200
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
  "success": true,
  "message": "Login Successfully.",
  "data": {
    "accessToken": "<jwt-token>",
    "user": {
      "id": "cm...",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "ADMIN"
    }
  },
  "statusCode": 200
}
```

### `GET /auth/me`

Returns the authenticated user from the JWT.

Auth:

- Any authenticated user

Response:

```json
{
  "success": true,
  "message": "Get Profile Successfully.",
  "data": {
    "id": "cm...",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "ADMIN"
  },
  "statusCode": 200
}
```

Cookie behavior:

- Successful login also sets an `httpOnly` cookie named `accessToken`
- The backend accepts JWTs from either:
- `Authorization: Bearer <token>`
- browser cookie `accessToken`

### `POST /auth/logout`

Clears the authentication cookie for the current user.

Auth:

- Any authenticated user

Response:

```json
{
  "success": true,
  "message": "Logout Successfully.",
  "data": null,
  "statusCode": 200
}
```

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
  "success": true,
  "message": "Create Task Successfully.",
  "data": {
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
  },
  "statusCode": 201
}
```

### `GET /tasks`

Get all tasks.

Response:

```json
{
  "success": true,
  "message": "Get All Tasks Successfully.",
  "data": [
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
  ],
  "statusCode": 200
}
```

- Ordered by `createdAt` descending

### `GET /tasks/:id`

Get a single task by id.

Response:

```json
{
  "success": true,
  "message": "Get Task Successfully.",
  "data": {
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
  },
  "statusCode": 200
}
```

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

```json
{
  "success": true,
  "message": "Update Task Successfully.",
  "data": {
    "id": "cm...",
    "title": "Updated title",
    "description": "Updated description",
    "status": "PROCESSING",
    "assignedUserId": "cm...",
    "createdAt": "2026-04-07T10:00:00.000Z",
    "updatedAt": "2026-04-07T10:05:00.000Z",
    "assignedUser": {
      "id": "cm...",
      "name": "Regular User",
      "email": "user@example.com",
      "role": "USER"
    }
  },
  "statusCode": 200
}
```

### `DELETE /tasks/:id`

Delete a task.

Response:

```json
{
  "success": true,
  "message": "Delete Task Successfully.",
  "data": {
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
  },
  "statusCode": 200
}
```

## User Task Endpoints

These endpoints require `USER` role.

### `GET /tasks/me`

Get tasks assigned to the current user.

Response:

```json
{
  "success": true,
  "message": "Get My Tasks Successfully.",
  "data": [
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
  ],
  "statusCode": 200
}
```

- Ordered by `createdAt` descending

### `GET /tasks/me/:id`

Get a single assigned task by id.

Response:

```json
{
  "success": true,
  "message": "Get My Task Successfully.",
  "data": {
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
  },
  "statusCode": 200
}
```

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

```json
{
  "success": true,
  "message": "Update Task Status Successfully.",
  "data": {
    "id": "cm...",
    "title": "Prepare report",
    "description": "Prepare weekly analytics report",
    "status": "DONE",
    "assignedUserId": "cm...",
    "createdAt": "2026-04-07T10:00:00.000Z",
    "updatedAt": "2026-04-07T10:05:00.000Z",
    "assignedUser": {
      "id": "cm...",
      "name": "Regular User",
      "email": "user@example.com",
      "role": "USER"
    }
  },
  "statusCode": 200
}
```

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
{
  "success": true,
  "message": "Get All Users Successfully.",
  "data": [
    {
      "id": "cm...",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "ADMIN",
      "createdAt": "2026-04-07T10:00:00.000Z",
      "updatedAt": "2026-04-07T10:00:00.000Z"
    }
  ],
  "statusCode": 200
}
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
{
  "success": true,
  "message": "Get Audit Logs Successfully.",
  "data": [
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
  ],
  "statusCode": 200
}
```

## Demo Accounts

The app seeds demo users on startup if they do not already exist. Actual values come from environment variables:

- `DEMO_ADMIN_EMAIL`
- `DEMO_ADMIN_PASSWORD`
- `DEMO_USER_EMAIL`
- `DEMO_USER_PASSWORD`
- `DEMO_USER_TWO_EMAIL`
- `DEMO_USER_TWO_PASSWORD`

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
