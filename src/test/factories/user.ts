import { user } from '@/shared/server/db/auth-schema'
import { testDb } from '../setup'

type UserOverrides = Partial<typeof user.$inferInsert>

let userCounter = 0

export async function createTestUser(overrides: UserOverrides = {}) {
  userCounter++
  const id = overrides.id ?? generateTestUserId(userCounter)

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
    .returning()

  return created
}

function generateTestUserId(counter: number): string {
  const timestamp = Date.now().toString()
  const prefix = `test-user-${counter}-`.padEnd(32, '0')
  return prefix.slice(0, 32)
}
