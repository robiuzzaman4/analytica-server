import { Module } from '@nestjs/common';
import { AppConfigModule } from './common/config/app-config.module';
import { PrismaModule } from './common/prisma/prisma.module';

@Module({
  imports: [AppConfigModule, PrismaModule],
})
export class AppModule {}
