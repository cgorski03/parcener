import { session } from '@/shared/server/db/auth-schema'
import { testDb } from '../setup'

type SessionOverrides = Partial<typeof session.$inferInsert>

/**
 * Creates a session in the database and returns the session token
 * to be used in request cookies
 */
export async function createTestSession(
    userId: string,
    overrides: SessionOverrides = {},
) {
    const token = overrides.token ?? `test-session-${crypto.randomUUID()}`
    const expiresAt = overrides.expiresAt ?? new Date(Date.now() + 1000 * 60 * 60 * 24) // 24 hours

    const [created] = await testDb
        .insert(session)
        .values({
            id: crypto.randomUUID(),
            userId,
            token,
            expiresAt,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .returning()

    return { session: created, token }
}

/**
 * Creates headers with auth cookie for making authenticated requests
 */
export function authHeaders(sessionToken: string): Headers {
    const headers = new Headers()
    // Better Auth uses 'better-auth.session_token' as the cookie name by default
    headers.set('Cookie', `better-auth.session_token=${sessionToken}`)
    return headers
}
