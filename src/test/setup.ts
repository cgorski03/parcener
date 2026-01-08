import { beforeAll, beforeEach, vi } from 'vitest';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/shared/server/db/schema';
import * as authSchema from '@/shared/server/db/auth-schema';
import { env } from 'cloudflare:test';

// Stub environment variables for tests
beforeAll(() => {
  vi.stubEnv('GOOGLE_API_KEY', 'test-api-key');
});

// Create test database connection
const client = postgres(env.HYPERDRIVE.connectionString);
export const testDb = drizzle(client, {
  schema: { ...schema, ...authSchema },
});

// Tables to truncate in correct order (respecting foreign keys)
const tablesToTruncate = [
  'claim',
  'room_member',
  'room',
  'receipt_item',
  'receipt_processing_information',
  'receipt',
  'payment_method',
  'invite',
  'session',
  'account',
  'verification',
  'user',
];

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
