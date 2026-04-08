import { AuditActionType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogsService } from './audit-logs.service';

describe('AuditLogsService', () => {
  let auditLogsService: AuditLogsService;
  let prismaService: {
    auditLog: {
      create: jest.Mock;
      count: jest.Mock;
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaService = {
      auditLog: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };

    auditLogsService = new AuditLogsService(
      prismaService as unknown as PrismaService,
    );
  });

  it('creates a task audit log entry', async () => {
    prismaService.auditLog.create.mockResolvedValue({ id: 'audit_1' });

    await expect(
      auditLogsService.createTaskLog({
        actorUserId: 'admin_1',
        actionType: AuditActionType.TASK_CREATED,
        targetEntityId: 'task_1',
        summary: 'Task created',
      }),
    ).resolves.toEqual({ id: 'audit_1' });

    expect(prismaService.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorUserId: 'admin_1',
        actionType: AuditActionType.TASK_CREATED,
        targetEntity: 'TASK',
        targetEntityId: 'task_1',
        summary: 'Task created',
      },
    });
  });

  it('lists audit logs newest first with optional filters', async () => {
    prismaService.auditLog.count.mockResolvedValue(1);
    prismaService.auditLog.findMany.mockResolvedValue([{ id: 'audit_1' }]);

    await expect(
      auditLogsService.findAll({
        actionType: AuditActionType.TASK_ASSIGNED,
        targetEntityId: 'task_1',
      }),
    ).resolves.toEqual({
      items: [{ id: 'audit_1' }],
      pagination: {
        page: 1,
        limit: 20,
        totalItems: 1,
        totalPages: 1,
      },
    });

    expect(prismaService.auditLog.count).toHaveBeenCalledWith({
      where: {
        actionType: AuditActionType.TASK_ASSIGNED,
        targetEntityId: 'task_1',
      },
    });
    expect(prismaService.auditLog.findMany).toHaveBeenCalledWith({
      where: {
        actionType: AuditActionType.TASK_ASSIGNED,
        targetEntityId: 'task_1',
      },
      skip: 0,
      take: 20,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        actorUserId: true,
        actionType: true,
        targetEntity: true,
        targetEntityId: true,
        summary: true,
        createdAt: true,
        actorUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  });
});
