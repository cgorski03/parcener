import { test as base, Page } from '@playwright/test';
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
    authenticateAsUploader: () => Promise<E2EAuthUser>;

    /**
     * Creates an authenticated user without upload privileges
     */
    authenticateAsRestrictedUser: () => Promise<E2EAuthUser>;

}

export const test = base.extend<AuthFixtures>({
    // Override page to wait for React hydration after each navigation
    page: async ({ page }, use) => {
        const originalGoto = page.goto.bind(page);
        page.goto = async (url, options) => {
            const response = await originalGoto(url, options);
            await page.waitForLoadState('networkidle');
            return response;
        };
        await use(page);
    },

    authenticateAs: async ({ context }, use, testInfo) => {
        // Track created users for cleanup
        const createdUserIds: string[] = [];

        const authenticate = async (options: CreateUserOptions = {}): Promise<E2EAuthUser> => {
            userCounter++;
            const email = options.email ?? `e2e-${testInfo.workerIndex}-${userCounter}-${Date.now()}@test.com`;
            const name = options.name ?? `E2E User ${userCounter}`;
            const password = 'testpassword123';

            // Default to false because the API will ignore this anyway
            const canUpload = options.canUpload ?? false;

            // 1. Sign up (Standard User)
            // We remove canUpload here because the API rejects/ignores it
            let setCookieHeader = '';
            const signUpResult = await authClient.signUp.email(
                {
                    email,
                    password,
                    name,
                    canUpload: false,
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

            const userId = signUpResult.data.user.id;

            if (canUpload) {
                await e2eDb.update(user)
                    .set({ canUpload: true })
                    .where(eq(user.id, userId));
            }

            // 3. Handle Session Token
            const sessionMatch = setCookieHeader.match(/better-auth\.session_token=([^;]+)/);
            if (!sessionMatch) {
                throw new Error('No session token in response');
            }
            const sessionToken = sessionMatch[1];

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

            createdUserIds.push(userId);

            return {
                user: {
                    id: userId,
                    email: signUpResult.data.user.email,
                    name: signUpResult.data.user.name,
                    canUpload, // Return the boolean we requested, not what the API returned initially
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

    authenticateAsUploader: async ({ authenticateAs }, use) => {
        const authenticate = async () => {
            return authenticateAs({ name: 'Uploader', canUpload: true });
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
