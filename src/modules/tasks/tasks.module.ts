import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/auth/guards/roles.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [AuditLogsModule],
  controllers: [TasksController],
  providers: [TasksService, RolesGuard],
  exports: [TasksService],
})
export class TasksModule {}
