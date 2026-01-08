import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { authConfig } from './schema';
import { createServerOnlyFn } from '@tanstack/react-start';
import { type DbType, authSchema } from '@/shared/server/db';

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
