import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/auth/guards/roles.guard';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';

@Module({
  controllers: [AuditLogsController],
  providers: [AuditLogsService, RolesGuard],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
