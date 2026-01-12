import { test as base } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { e2eDb } from './db';
import type { AppUser } from '@/shared/server/db';
import { user } from '@/shared/server/db/auth-schema';
import { authClient } from '@/shared/lib/auth-client';

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
  authenticateAs: (options?: CreateUserOptions) => Promise<E2EAuthUser>;
  authenticateAsUploader: () => Promise<E2EAuthUser>;
  authenticateAsRestrictedUser: () => Promise<E2EAuthUser>;
}

export const test = base.extend<AuthFixtures>({
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
    const createdUserIds: Array<string> = [];

    const authenticate = async (
      options: CreateUserOptions = {},
    ): Promise<E2EAuthUser> => {
      userCounter++;
      const email =
        options.email ??
        `e2e-${testInfo.workerIndex}-${userCounter}-${Date.now()}@test.com`;
      const name = options.name ?? `E2E User ${userCounter}`;
      const password = 'testpassword123';
      const canUpload = options.canUpload ?? false;

      // 1. Sign up (Initial creation)
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
      createdUserIds.push(userId); // Track for cleanup

      // 2. Modify Database directly
      if (canUpload) {
        await e2eDb
          .update(user)
          .set({ canUpload: true })
          .where(eq(user.id, userId));

        // 3. RE-AUTHENTICATE
        // The previous session (from signUp) is now stale because it doesn't
        // contain the 'canUpload' claim. We sign in again to generate a
        // fresh session token that includes the updated DB state.
        const signInResult = await authClient.signIn.email(
          {
            email,
            password,
          },
          {
            onSuccess: (ctx) => {
              // Overwrite the cookie header with the new, correct session
              setCookieHeader = ctx.response.headers.get('set-cookie') ?? '';
            },
          },
        );

        if (signInResult.error) {
          throw new Error(
            `Failed to re-sign in after DB update: ${signInResult.error.message}`,
          );
        }
      }

      // 4. Extract Session Token (from the latest operation)
      const sessionMatch = setCookieHeader.match(
        /better-auth\.session_token=([^;]+)/,
      );
      if (!sessionMatch) {
        throw new Error('No session token found in headers');
      }
      const sessionToken = sessionMatch[1];

      // 5. Set the cookie in the browser context
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

      return {
        user: {
          id: userId,
          email,
          name,
          canUpload,
        },
        sessionToken,
      };
    };

    await use(authenticate);

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
