import { test as base } from '@playwright/test';
import { e2eDb } from './db';
import { user } from '@/shared/server/db/auth-schema';
import { eq } from 'drizzle-orm';
import { AppUser } from '@/shared/server/db';
import { authClient } from '@/shared/lib/auth-client';

// Create auth client for E2E tests (vanilla JS, not React)
// Note: We don't use inferAdditionalFields here to keep signup simple
// canUpload is set via direct DB update after user creation

interface E2EAuthUser {
    user: AppUser;
    sessionToken: string;
}

interface CreateUserOptions {
    name?: string;
    email?: string;
    canUpload?: boolean;
}

let userCounter = 0;

interface AuthFixtures {
    /**
     * Creates an authenticated user via better-auth and logs them into the browser
     */
    authenticateAs: (options?: CreateUserOptions) => Promise<E2EAuthUser>;

    /**
     * Creates an authenticated user with upload privileges
     */
    authenticateAsAdmin: () => Promise<E2EAuthUser>;

    /**
     * Creates an authenticated user without upload privileges
     */
    authenticateAsRestrictedUser: () => Promise<E2EAuthUser>;

}

export const test = base.extend<AuthFixtures>({
    authenticateAs: async ({ context }, use, testInfo) => {
        // Track created users for cleanup
        const createdUserIds: string[] = [];

        const authenticate = async (options: CreateUserOptions = {}): Promise<E2EAuthUser> => {
            userCounter++;
            const email = options.email ?? `e2e-${testInfo.workerIndex}-${userCounter}-${Date.now()}@test.com`;
            const name = options.name ?? `E2E User ${userCounter}`;
            const password = 'testpassword123';
            const canUpload = options.canUpload ?? false;

            // Sign up via better-auth API with fetchOptions to capture response headers
            let setCookieHeader = '';

            const signUpResult = await authClient.signUp.email(
                {
                    email,
                    password,
                    name,
                    canUpload,
                },
                {
                    onSuccess: (ctx) => {
                        setCookieHeader = ctx.response.headers.get('set-cookie') ?? '';
                    },
                },
            );

            if (signUpResult.error) {
                throw new Error(`Failed to sign up: ${signUpResult.error.message}`);
            }

            // Parse the session token from set-cookie header
            const sessionMatch = setCookieHeader.match(/better-auth\.session_token=([^;]+)/);
            if (!sessionMatch) {
                throw new Error('No session token in response');
            }
            const sessionToken = sessionMatch[1];

            // Inject the session cookie into the browser context
            await context.addCookies([
                {
                    name: 'better-auth.session_token',
                    value: sessionToken,
                    domain: 'localhost',
                    path: '/',
                    httpOnly: true,
                    sameSite: 'Lax',
                },
            ]);

            const userId = signUpResult.data.user.id;
            createdUserIds.push(userId);

            return {
                user: {
                    id: userId,
                    email: signUpResult.data.user.email,
                    name: signUpResult.data.user.name,
                    canUpload,
                },
                sessionToken,
            };
        };

        await use(authenticate);

        // Cleanup: delete all users created during this test (cascades to related data)
        for (const userId of createdUserIds) {
            await e2eDb.delete(user).where(eq(user.id, userId));
        }
    },

    authenticateAsAdmin: async ({ authenticateAs }, use) => {
        const authenticate = async () => {
            return authenticateAs({ name: 'Admin User', canUpload: true });
        };
        await use(authenticate);
    },

    authenticateAsRestrictedUser: async ({ authenticateAs }, use) => {
        const authenticate = async () => {
            return authenticateAs({ name: 'Restricted User', canUpload: false });
        };
        await use(authenticate);
    },
});

export { expect } from '@playwright/test';
