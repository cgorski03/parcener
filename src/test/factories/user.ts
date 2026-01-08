import { user } from '@/shared/server/db/auth-schema';
import { testDb } from '../setup';

type UserOverrides = Partial<typeof user.$inferInsert>;

let userCounter = 0;

export async function createTestUser(overrides: UserOverrides = {}) {
  userCounter++;
  const id = overrides.id ?? generateTestUserId();

  const [created] = await testDb
    .insert(user)
    .values({
      id,
      name: overrides.name ?? `Test User ${userCounter}`,
      email: overrides.email ?? `test${userCounter}@example.com`,
      emailVerified: overrides.emailVerified ?? true,
      canUpload: overrides.canUpload ?? true,
      image: overrides.image ?? null,
    })
    .returning();

  return created;
}

function generateTestUserId(): string {
  const timestamp = Date.now().toString().padStart(12, '0');
  const randomPart = crypto.randomUUID().split('-')[0];
  return `${timestamp.substring(0, 8)}${timestamp.substring(8)}${randomPart}-${timestamp.substring(4, 6)}${timestamp.substring(6, 8)}-${timestamp.substring(8, 12)}-${randomPart}${randomPart.substring(0, 3)}${randomPart.substring(3)}-${timestamp.substring(0, 12)}`;
}
