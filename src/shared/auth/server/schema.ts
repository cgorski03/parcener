import { env } from 'cloudflare:workers';
import type { BetterAuthOptions } from 'better-auth';

const CAN_UPLOAD_ROLLOUT_LIMIT = 500;
const ENABLE_CAN_UPLOAD_ROLLOUT = env.NODE_ENV === 'production';

export const authConfig = {
  emailAndPassword: {
    enabled: env.NODE_ENV === 'test',
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID || '',
      clientSecret: env.GOOGLE_CLIENT_SECRET || '',
    },
  },
  user: {
    additionalFields: {
      canUpload: {
        type: 'boolean',
        defaultValue: false,
        input: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          if (!context || !ENABLE_CAN_UPLOAD_ROLLOUT) return;

          const usersWithUploadEnabled = await context.context.adapter.count({
            model: 'user',
            where: [
              {
                field: 'canUpload',
                operator: 'eq',
                value: true,
              },
            ],
          });

          if (usersWithUploadEnabled >= CAN_UPLOAD_ROLLOUT_LIMIT) {
            return;
          }

          return {
            data: {
              ...user,
              canUpload: true,
            },
          };
        },
      },
    },
  },

  // We want sessions to persist. This is not an application users are constantly on, but they should
  // be able to click on someones room and still be logged in, even a week later.
  // Its also just really not security-critical
  session: {
    // Set expiration to 90 days (in seconds)
    expiresIn: 60 * 60 * 24 * 90,
    // Update the session expiry if they visit and the
    // session is older than 1 day
    updateAge: 60 * 60 * 24,
    // Ensure the cookie is persistent
    cookieCache: {
      enabled: false,
    },
  },
} satisfies BetterAuthOptions;
