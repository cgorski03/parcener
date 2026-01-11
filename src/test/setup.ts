import { beforeAll, beforeEach, vi } from 'vitest';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from 'cloudflare:test';
import { tablesToTruncate } from './helpers/truncate-tables';
import * as schema from '@/shared/server/db/schema';
import * as authSchema from '@/shared/server/db/auth-schema';

// Stub environment variables for tests
beforeAll(() => {
  vi.stubEnv('GOOGLE_API_KEY', 'test-api-key');
});

// Create test database connection
const client = postgres(env.HYPERDRIVE.connectionString, {
  onnotice: () => {},
});
export const testDb = drizzle(client, {
  schema: { ...schema, ...authSchema },
});

export async function resetDatabase() {
  // Truncate all tables in reverse dependency order
  for (const table of tablesToTruncate) {
    await testDb.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
  }
}

// Reset database before each test
beforeEach(async () => {
  await resetDatabase();
});
