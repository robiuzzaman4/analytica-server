require('dotenv/config');

const { randomBytes, scryptSync } = require('node:crypto');
const { PrismaClient, Role } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Missing required environment variable: DATABASE_URL');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function upsertDemoUser({ name, email, password, role }) {
  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: hashPassword(password),
      role,
    },
    create: {
      name,
      email,
      password: hashPassword(password),
      role,
    },
  });
}

async function main() {
  const admin = await upsertDemoUser({
    name: requireEnv('DEMO_ADMIN_NAME'),
    email: requireEnv('DEMO_ADMIN_EMAIL'),
    password: requireEnv('DEMO_ADMIN_PASSWORD'),
    role: Role.ADMIN,
  });

  const user = await upsertDemoUser({
    name: requireEnv('DEMO_USER_NAME'),
    email: requireEnv('DEMO_USER_EMAIL'),
    password: requireEnv('DEMO_USER_PASSWORD'),
    role: Role.USER,
  });

  console.log(`Seeded demo users: ${admin.email}, ${user.email}`);
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
