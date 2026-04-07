/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { hash } from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import { Pool } from 'pg';
import { validateEnvironment } from '../config/env.validation';

export interface DemoUserSeedConfig {
  admin: {
    name: string;
    email: string;
    password: string;
  };
  user: {
    name: string;
    email: string;
    password: string;
  };
}

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: Role;
}

interface SeedUserModel {
  findUnique(args: { where: { email: string } }): Promise<UserRecord | null>;
  create(args: {
    data: {
      name: string;
      email: string;
      password: string;
      role: Role;
    };
  }): Promise<UserRecord>;
}

interface SeedPrismaClient {
  user: SeedUserModel;
}

export function getDemoUserSeedConfig(env = process.env): DemoUserSeedConfig {
  const validatedEnv = validateEnvironment(env);

  return {
    admin: {
      name: validatedEnv.DEMO_ADMIN_NAME,
      email: validatedEnv.DEMO_ADMIN_EMAIL,
      password: validatedEnv.DEMO_ADMIN_PASSWORD,
    },
    user: {
      name: validatedEnv.DEMO_USER_NAME,
      email: validatedEnv.DEMO_USER_EMAIL,
      password: validatedEnv.DEMO_USER_PASSWORD,
    },
  };
}

export async function ensureDemoUsersSeeded(
  prisma: SeedPrismaClient,
  config: DemoUserSeedConfig,
) {
  const admin = await ensureDemoUser(prisma, {
    ...config.admin,
    role: Role.ADMIN,
  });
  const user = await ensureDemoUser(prisma, {
    ...config.user,
    role: Role.USER,
  });

  return { admin, user };
}

export async function runSeedFromEnvironment(env = process.env) {
  const validatedEnv = validateEnvironment(env);
  const config = getDemoUserSeedConfig(env);
  const pool = new Pool({ connectionString: validatedEnv.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const result = await ensureDemoUsersSeeded(prisma, config);

    console.log(
      `Seeded demo users: ${result.admin.email}, ${result.user.email}`,
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

async function ensureDemoUser(
  prisma: SeedPrismaClient,
  input: {
    name: string;
    email: string;
    password: string;
    role: Role;
  },
) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    return existingUser;
  }

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: await hashPassword(input.password),
      role: input.role,
    },
  });
}

function hashPassword(password: string) {
  return hash(password, 10);
}
