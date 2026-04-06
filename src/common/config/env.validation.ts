const requiredKeys = [
  'DATABASE_URL',
  'JWT_SECRET',
  'DEMO_ADMIN_NAME',
  'DEMO_ADMIN_EMAIL',
  'DEMO_ADMIN_PASSWORD',
  'DEMO_USER_NAME',
  'DEMO_USER_EMAIL',
  'DEMO_USER_PASSWORD',
] as const;

type AppEnvironment = {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  DEMO_ADMIN_NAME: string;
  DEMO_ADMIN_EMAIL: string;
  DEMO_ADMIN_PASSWORD: string;
  DEMO_USER_NAME: string;
  DEMO_USER_EMAIL: string;
  DEMO_USER_PASSWORD: string;
};

export function validateEnvironment(
  config: Record<string, unknown>,
): AppEnvironment {
  const missingKeys = requiredKeys.filter((key) => !config[key]);

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingKeys.join(', ')}`,
    );
  }

  const port = Number(config.PORT ?? 3000);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error('PORT must be a positive number');
  }

  return {
    PORT: port,
    DATABASE_URL: String(config.DATABASE_URL),
    JWT_SECRET: String(config.JWT_SECRET),
    DEMO_ADMIN_NAME: String(config.DEMO_ADMIN_NAME),
    DEMO_ADMIN_EMAIL: String(config.DEMO_ADMIN_EMAIL),
    DEMO_ADMIN_PASSWORD: String(config.DEMO_ADMIN_PASSWORD),
    DEMO_USER_NAME: String(config.DEMO_USER_NAME),
    DEMO_USER_EMAIL: String(config.DEMO_USER_EMAIL),
    DEMO_USER_PASSWORD: String(config.DEMO_USER_PASSWORD),
  };
}
