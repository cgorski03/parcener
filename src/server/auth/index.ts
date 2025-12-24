import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { authConfig } from './schema';
import { authSchema, DbType } from '../db';
import { createServerOnlyFn } from '@tanstack/react-start';

export const createAuth = createServerOnlyFn((db: DbType, env: Env) => {
    const auth = betterAuth({
        ...authConfig,
        baseURL: env.BASE_URL,
        database: drizzleAdapter(db, {
            schema: authSchema,
            provider: 'pg',
        }),
    });
    return auth
})

export type ApplicationAuthClient = ReturnType<typeof createAuth>;
