import { AuditActionType, Role } from '@prisma/client';
import { ROLES_KEY } from '../../common/auth/decorators/roles.decorator';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';

describe('AuditLogsController', () => {
  let auditLogsController: AuditLogsController;
  let auditLogsService: {
    findAll: jest.Mock;
  };

  beforeEach(() => {
    auditLogsService = {
      findAll: jest.fn(),
    };

    auditLogsController = new AuditLogsController(
      auditLogsService as unknown as AuditLogsService,
    );
  });

  it('marks audit log access as admin-only', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AuditLogsController)).toEqual([
      Role.ADMIN,
    ]);
  });

  it('delegates audit log queries to the service', async () => {
    const query: AuditLogQueryDto = {
      actionType: AuditActionType.TASK_STATUS_CHANGED,
      targetEntityId: 'task_1',
    };

    auditLogsService.findAll.mockResolvedValue([{ id: 'audit_1' }]);

    await expect(auditLogsController.findAll(query)).resolves.toEqual({
      statusCode: 200,
      success: true,
      message: 'Get Audit Logs Successfully.',
      data: [{ id: 'audit_1' }],
    });

    expect(auditLogsService.findAll).toHaveBeenCalledWith(query);
  });
});
