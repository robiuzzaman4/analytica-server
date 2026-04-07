import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditActionType, Role, TaskStatus } from '@prisma/client';
import { hash } from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { ApiResponse } from '../src/common/http/interfaces/api-response.interface';
import { PrismaService } from '../src/common/prisma/prisma.service';

type TestUserRecord = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

type TestTaskRecord = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type TestAuditLogRecord = {
  id: string;
  actorUserId: string;
  actionType: AuditActionType;
  targetEntity: string;
  targetEntityId: string;
  summary: string;
  createdAt: Date;
};

type AuthUserDto = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type AuthLoginDto = {
  accessToken: string;
  user: AuthUserDto;
};

type TaskDto = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  assignedUser: AuthUserDto | null;
};

type AuditLogDto = {
  id: string;
  actorUserId: string;
  actionType: AuditActionType;
  targetEntity: string;
  targetEntityId: string;
  summary: string;
  createdAt: Date;
  actorUser: AuthUserDto | null;
};

function getResponseBody<T>(response: request.Response): ApiResponse<T> {
  return response.body as ApiResponse<T>;
}

function createPrismaMock() {
  let users: TestUserRecord[] = [];
  let tasks: TestTaskRecord[] = [];
  let auditLogs: TestAuditLogRecord[] = [];
  let taskSequence = 1;
  let auditSequence = 1;

  const mapUser = (user: TestUserRecord) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });

  const mapTask = (task: TestTaskRecord) => {
    const assignedUser = task.assignedUserId
      ? (users.find((user) => user.id === task.assignedUserId) ?? null)
      : null;

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      assignedUserId: task.assignedUserId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assignedUser: assignedUser
        ? {
            id: assignedUser.id,
            name: assignedUser.name,
            email: assignedUser.email,
            role: assignedUser.role,
          }
        : null,
    };
  };

  const mapAuditLog = (auditLog: TestAuditLogRecord) => {
    const actorUser = users.find((user) => user.id === auditLog.actorUserId);

    return {
      id: auditLog.id,
      actorUserId: auditLog.actorUserId,
      actionType: auditLog.actionType,
      targetEntity: auditLog.targetEntity,
      targetEntityId: auditLog.targetEntityId,
      summary: auditLog.summary,
      createdAt: auditLog.createdAt,
      actorUser: actorUser
        ? {
            id: actorUser.id,
            name: actorUser.name,
            email: actorUser.email,
            role: actorUser.role,
          }
        : null,
    };
  };

  return {
    user: {
      findUnique: jest.fn(
        ({
          where,
        }: {
          where: { id?: string; email?: string };
          select?: Record<string, boolean>;
        }) => {
          const user =
            users.find((item) =>
              where.id ? item.id === where.id : item.email === where.email,
            ) ?? null;

          return user;
        },
      ),
      findMany: jest.fn(() =>
        [...users]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .map(mapUser),
      ),
    },
    task: {
      create: jest.fn(
        ({
          data,
        }: {
          data: {
            title: string;
            description: string;
            status: TaskStatus;
            assignedUserId: string | null;
          };
          select?: Record<string, unknown>;
        }) => {
          const now = new Date(Date.now() + taskSequence);
          const task: TestTaskRecord = {
            id: `task_${taskSequence++}`,
            title: data.title,
            description: data.description,
            status: data.status,
            assignedUserId: data.assignedUserId,
            createdAt: now,
            updatedAt: now,
          };

          tasks.push(task);

          return mapTask(task);
        },
      ),
      findMany: jest.fn(
        ({
          where,
        }: {
          where?: { assignedUserId?: string };
          orderBy?: { createdAt: 'desc' | 'asc' };
          select?: Record<string, unknown>;
        }) =>
          [...tasks]
            .filter((task) =>
              where?.assignedUserId
                ? task.assignedUserId === where.assignedUserId
                : true,
            )
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map(mapTask),
      ),
      findUnique: jest.fn(
        ({
          where,
        }: {
          where: { id: string };
          select?: Record<string, unknown>;
        }) => {
          const task = tasks.find((item) => item.id === where.id) ?? null;

          return task ? mapTask(task) : null;
        },
      ),
      findFirst: jest.fn(
        ({
          where,
        }: {
          where: { id: string; assignedUserId: string };
          select?: Record<string, unknown>;
        }) => {
          const task =
            tasks.find(
              (item) =>
                item.id === where.id &&
                item.assignedUserId === where.assignedUserId,
            ) ?? null;

          return task ? mapTask(task) : null;
        },
      ),
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<{
            title: string;
            description: string;
            status: TaskStatus;
            assignedUserId: string | null;
          }>;
          select?: Record<string, unknown>;
        }) => {
          const task = tasks.find((item) => item.id === where.id);

          if (!task) {
            throw new Error(`Task ${where.id} not found`);
          }

          Object.assign(task, data, { updatedAt: new Date() });

          return mapTask(task);
        },
      ),
      delete: jest.fn(
        ({
          where,
        }: {
          where: { id: string };
          select?: Record<string, unknown>;
        }) => {
          const taskIndex = tasks.findIndex((item) => item.id === where.id);

          if (taskIndex < 0) {
            throw new Error(`Task ${where.id} not found`);
          }

          const [deletedTask] = tasks.splice(taskIndex, 1);

          return mapTask(deletedTask);
        },
      ),
    },
    auditLog: {
      create: jest.fn(
        ({
          data,
        }: {
          data: {
            actorUserId: string;
            actionType: AuditActionType;
            targetEntity: string;
            targetEntityId: string;
            summary: string;
          };
        }) => {
          const auditLog: TestAuditLogRecord = {
            id: `audit_${auditSequence++}`,
            actorUserId: data.actorUserId,
            actionType: data.actionType,
            targetEntity: data.targetEntity,
            targetEntityId: data.targetEntityId,
            summary: data.summary,
            createdAt: new Date(Date.now() + auditSequence),
          };

          auditLogs.push(auditLog);

          return auditLog;
        },
      ),
      findMany: jest.fn(
        ({
          where,
        }: {
          where?: {
            actionType?: AuditActionType;
            targetEntityId?: string;
          };
          orderBy?: { createdAt: 'desc' | 'asc' };
          select?: Record<string, unknown>;
        }) =>
          [...auditLogs]
            .filter((auditLog) => {
              if (
                where?.actionType &&
                auditLog.actionType !== where.actionType
              ) {
                return false;
              }

              if (
                where?.targetEntityId &&
                auditLog.targetEntityId !== where.targetEntityId
              ) {
                return false;
              }

              return true;
            })
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map(mapAuditLog),
      ),
    },
    reset: async () => {
      const [adminPassword, userPassword, extraUserPassword] =
        await Promise.all([
          hash('Admin123!', 10),
          hash('User123!', 10),
          hash('Other123!', 10),
        ]);

      const now = new Date('2026-04-08T00:00:00.000Z');

      users = [
        {
          id: 'admin_1',
          name: 'Admin User',
          email: 'admin@analytica.local',
          password: adminPassword,
          role: Role.ADMIN,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'user_1',
          name: 'Normal User',
          email: 'user@analytica.local',
          password: userPassword,
          role: Role.USER,
          createdAt: new Date('2026-04-08T00:01:00.000Z'),
          updatedAt: new Date('2026-04-08T00:01:00.000Z'),
        },
        {
          id: 'user_2',
          name: 'Other User',
          email: 'other@analytica.local',
          password: extraUserPassword,
          role: Role.USER,
          createdAt: new Date('2026-04-08T00:02:00.000Z'),
          updatedAt: new Date('2026-04-08T00:02:00.000Z'),
        },
      ];

      tasks = [
        {
          id: 'task_seed_user_1',
          title: 'User Task',
          description: 'Assigned to the normal user',
          status: TaskStatus.PENDING,
          assignedUserId: 'user_1',
          createdAt: new Date('2026-04-08T00:03:00.000Z'),
          updatedAt: new Date('2026-04-08T00:03:00.000Z'),
        },
        {
          id: 'task_seed_user_2',
          title: 'Other Task',
          description: 'Assigned to another user',
          status: TaskStatus.PROCESSING,
          assignedUserId: 'user_2',
          createdAt: new Date('2026-04-08T00:04:00.000Z'),
          updatedAt: new Date('2026-04-08T00:04:00.000Z'),
        },
      ];

      auditLogs = [
        {
          id: 'audit_seed_1',
          actorUserId: 'admin_1',
          actionType: AuditActionType.TASK_CREATED,
          targetEntity: 'TASK',
          targetEntityId: 'task_seed_user_1',
          summary: 'Seed task created',
          createdAt: new Date('2026-04-08T00:05:00.000Z'),
        },
      ];

      taskSequence = 3;
      auditSequence = 2;
    },
  };
}

describe('App E2E', () => {
  let app: INestApplication<App>;
  const prismaMock = createPrismaMock();

  beforeAll(async () => {
    process.env.DATABASE_URL ??=
      'postgresql://postgres:123456@localhost:5432/analytica_task_management_db?schema=public';
    process.env.JWT_SECRET ??= 'test-secret';
    process.env.DEMO_ADMIN_NAME ??= 'Admin User';
    process.env.DEMO_ADMIN_EMAIL ??= 'admin@analytica.local';
    process.env.DEMO_ADMIN_PASSWORD ??= 'Admin123!';
    process.env.DEMO_USER_NAME ??= 'Normal User';
    process.env.DEMO_USER_EMAIL ??= 'user@analytica.local';
    process.env.DEMO_USER_PASSWORD ??= 'User123!';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  beforeEach(async () => {
    await prismaMock.reset();
  });

  afterAll(async () => {
    await app.close();
  });

  const login = async (email: string, password: string) => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password });

    return getResponseBody<AuthLoginDto>(response).data?.accessToken ?? '';
  };

  it('returns the health response envelope', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect({
        success: true,
        message: 'Health check retrieved successfully',
        data: { status: 'ok' },
        statusCode: 200,
      });
  });

  it('logs in successfully and sets an auth cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@analytica.local',
        password: 'Admin123!',
      })
      .expect(200);

    const body = getResponseBody<AuthLoginDto>(response);

    expect(body.success).toBe(true);
    expect(body.data?.user.email).toBe('admin@analytica.local');
    expect(body.data?.accessToken).toEqual(expect.any(String));
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('accessToken=')]),
    );
  });

  it('rejects invalid login credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@analytica.local',
        password: 'wrong-password',
      })
      .expect(401)
      .expect({
        success: false,
        message: 'Invalid email or password',
        data: null,
        statusCode: 401,
      });
  });

  it('returns the authenticated user from /auth/me', async () => {
    const accessToken = await login('admin@analytica.local', 'Admin123!');

    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(getResponseBody<AuthUserDto>(response)).toEqual({
      success: true,
      message: 'Get Profile Successfully.',
      data: {
        id: 'admin_1',
        name: 'Admin User',
        email: 'admin@analytica.local',
        role: Role.ADMIN,
      },
      statusCode: 200,
    });
  });

  it('allows an admin to create, update, fetch, and delete a task', async () => {
    const accessToken = await login('admin@analytica.local', 'Admin123!');

    const created = await request(app.getHttpServer())
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Release checklist',
        description: 'Prepare the release plan',
        assignedUserId: 'user_1',
      })
      .expect(201);

    const createdBody = getResponseBody<TaskDto>(created);

    expect(createdBody.success).toBe(true);
    expect(createdBody.data?.title).toBe('Release checklist');
    expect(createdBody.data?.status).toBe(TaskStatus.PENDING);

    const taskId = createdBody.data?.id;

    expect(taskId).toBeDefined();

    await request(app.getHttpServer())
      .get(`/api/v1/tasks/${taskId ?? ''}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = getResponseBody<TaskDto>(response);
        expect(body.data?.id).toBe(taskId);
        expect(body.data?.assignedUserId).toBe('user_1');
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${taskId ?? ''}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Release checklist updated',
        description: 'Finalize the release plan',
        status: TaskStatus.DONE,
        assignedUserId: 'user_2',
      })
      .expect(200)
      .expect((response) => {
        const body = getResponseBody<TaskDto>(response);
        expect(body.data?.title).toBe('Release checklist updated');
        expect(body.data?.status).toBe(TaskStatus.DONE);
        expect(body.data?.assignedUserId).toBe('user_2');
      });

    await request(app.getHttpServer())
      .delete(`/api/v1/tasks/${taskId ?? ''}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = getResponseBody<TaskDto>(response);
        expect(body.data?.id).toBe(taskId);
      });
  });

  it('prevents a normal user from accessing admin task listing', async () => {
    const accessToken = await login('user@analytica.local', 'User123!');

    await request(app.getHttpServer())
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403)
      .expect({
        success: false,
        message: 'You do not have permission to access this resource',
        data: null,
        statusCode: 403,
      });
  });

  it('returns only the tasks assigned to the current user', async () => {
    const accessToken = await login('user@analytica.local', 'User123!');

    const response = await request(app.getHttpServer())
      .get('/api/v1/tasks/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = getResponseBody<TaskDto[]>(response);

    expect(body.data).toHaveLength(1);
    expect(body.data?.[0]?.id).toBe('task_seed_user_1');
    expect(body.data?.[0]?.assignedUserId).toBe('user_1');
  });

  it('lets a user update the status of an assigned task', async () => {
    const accessToken = await login('user@analytica.local', 'User123!');

    const response = await request(app.getHttpServer())
      .patch('/api/v1/tasks/task_seed_user_1/status')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: TaskStatus.DONE })
      .expect(200);

    expect(getResponseBody<TaskDto>(response).data?.status).toBe(
      TaskStatus.DONE,
    );

    const auditResponse = await request(app.getHttpServer())
      .get('/api/v1/audit-logs')
      .set(
        'Authorization',
        `Bearer ${await login('admin@analytica.local', 'Admin123!')}`,
      )
      .query({
        actionType: AuditActionType.TASK_STATUS_CHANGED,
        targetEntityId: 'task_seed_user_1',
      })
      .expect(200);

    expect(
      getResponseBody<AuditLogDto[]>(auditResponse).data?.[0]?.actionType,
    ).toBe(AuditActionType.TASK_STATUS_CHANGED);
  });

  it('rejects status updates for tasks the user does not own', async () => {
    const accessToken = await login('user@analytica.local', 'User123!');

    await request(app.getHttpServer())
      .patch('/api/v1/tasks/task_seed_user_2/status')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: TaskStatus.DONE })
      .expect(404)
      .expect({
        success: false,
        message: 'Task with id "task_seed_user_2" not found',
        data: null,
        statusCode: 404,
      });
  });

  it('allows an admin to view audit logs and blocks normal users', async () => {
    const adminToken = await login('admin@analytica.local', 'Admin123!');
    const userToken = await login('user@analytica.local', 'User123!');

    await request(app.getHttpServer())
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403)
      .expect({
        success: false,
        message: 'You do not have permission to access this resource',
        data: null,
        statusCode: 403,
      });

    const response = await request(app.getHttpServer())
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = getResponseBody<AuditLogDto[]>(response);

    expect(body.success).toBe(true);
    expect(body.data?.length).toBeGreaterThan(0);
    expect(body.data?.[0]?.actorUserId).toEqual(expect.any(String));
    expect(body.data?.[0]?.actionType).toEqual(expect.any(String));
    expect(body.data?.[0]?.targetEntity).toBe('TASK');
  });
});
