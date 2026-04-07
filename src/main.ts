import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ensureDemoUsersSeeded,
  getDemoUserSeedConfig,
} from './common/seed/demo-users.seed';
import { PrismaService } from './common/prisma/prisma.service';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 5000);
  const prismaService = app.get(PrismaService);

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      forbidNonWhitelisted: true,
    }),
  );

  const demoUserConfig = getDemoUserSeedConfig(process.env);

  await ensureDemoUsersSeeded(prismaService, demoUserConfig);
  await app.listen(port);
}

bootstrap().catch((error: unknown) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
