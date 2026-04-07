import { NestFactory } from '@nestjs/core';
import {
  ensureDemoUsersSeeded,
  getDemoUserSeedConfig,
} from './common/seed/demo-users.seed';
import { PrismaService } from './common/prisma/prisma.service';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 5000;
  const prismaService = app.get(PrismaService);

  const demoUserConfig = getDemoUserSeedConfig(process.env);

  await ensureDemoUsersSeeded(prismaService, demoUserConfig);
  await app.listen(port);
  console.log(`SERVER IS RUNNING ON PORT: ${port}`);
}

bootstrap().catch((error: unknown) => {
  console.error('FAILED TO RUN SERVER:', error);
  process.exit(1);
});
