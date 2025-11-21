import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as authSchema from './auth-schema';

const client = postgres({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT!),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

export const db = drizzle(client, {
    schema: {
        ...schema,
        ...authSchema,
    },
});

export * from './schema';
export * from './auth-schema';
export type { ReceiptSelect, ReceiptInsert } from './schema';
