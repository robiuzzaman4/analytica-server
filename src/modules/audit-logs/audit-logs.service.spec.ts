import { AuditActionType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogsService } from './audit-logs.service';

describe('AuditLogsService', () => {
  let auditLogsService: AuditLogsService;
  let prismaService: {
    auditLog: {
      create: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaService = {
      auditLog: {
        create: jest.fn(),
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
});
