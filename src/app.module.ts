import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AppConfigModule } from './common/config/app-config.module';
import { ApiExceptionFilter } from './common/http/filters/api-exception.filter';
import { PrismaModule } from './common/prisma/prisma.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { UsersModule } from './modules/users/users.module';
import { AppController } from './app.controller';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  controllers: [AppController],
  imports: [
    AppConfigModule,
    PrismaModule,
    AuthModule,
    AuditLogsModule,
    TasksModule,
    UsersModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
