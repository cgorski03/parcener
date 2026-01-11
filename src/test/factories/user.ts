import type { DbType } from '@/shared/server/db';
import { user } from '@/shared/server/db/auth-schema';

type UserOverrides = Partial<typeof user.$inferInsert>;

let userCounter = 0;

export async function createTestUser(
    db: DbType,
    overrides: UserOverrides = {},
) {
    userCounter++;
    const id = overrides.id ?? generateTestUserId();
    // Use timestamp + random to ensure uniqueness across parallel workers
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const [created] = await db
        .insert(user)
        .values({
            id,
            name: overrides.name ?? `Test User ${userCounter}`,
            email: overrides.email ?? `test-${uniqueSuffix}@example.com`,
            emailVerified: overrides.emailVerified ?? true,
            canUpload: overrides.canUpload ?? true,
            image: overrides.image ?? null,
        })
        .returning();

    return created;
}

export function generateTestUserId(): string {
    const timestamp = Date.now().toString().slice(-12).padStart(12, '0');
    const randomPart = crypto.randomUUID().replace(/-/g, '');
    return `${timestamp}${randomPart.substring(0, 20)}`;
}
