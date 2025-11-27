import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { authConfig } from './schema';
import { authSchema, DbType } from '../db';

export const createAuth = (db: DbType) => {
    const auth = betterAuth({
        ...authConfig,
        database: drizzleAdapter(db, {
            schema: authSchema,
            provider: 'pg',
        }),
    });
    return auth
}

export type ApplicationAuthClient = ReturnType<typeof createAuth>;
