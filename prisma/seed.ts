import 'dotenv/config';
import { runSeedFromEnvironment } from '../src/common/seed/demo-users.seed';

runSeedFromEnvironment().catch((error: unknown) => {
  console.error('Seeding failed:', error);
  process.exitCode = 1;
});
