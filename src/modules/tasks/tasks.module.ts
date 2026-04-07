import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/auth/guards/roles.guard';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  controllers: [TasksController],
  providers: [TasksService, RolesGuard],
})
export class TasksModule {}
