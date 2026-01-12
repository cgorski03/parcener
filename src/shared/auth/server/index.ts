import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createServerOnlyFn } from '@tanstack/react-start';
import { authConfig } from './schema';
import type { DbType } from '@/shared/server/db';
import { authSchema } from '@/shared/server/db';

export const createAuth = createServerOnlyFn((db: DbType, env: Env) => {
  const auth = betterAuth({
    ...authConfig,
    baseURL: env.BASE_URL,
    database: drizzleAdapter(db, {
      schema: authSchema,
      provider: 'pg',
    }),
  });
  return auth;
});

export type ApplicationAuthClient = ReturnType<typeof createAuth>;
