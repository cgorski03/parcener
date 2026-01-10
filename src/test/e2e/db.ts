import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { tablesToTruncate } from '../helpers/truncate-tables';
import * as schema from '@/shared/server/db/schema';
import * as authSchema from '@/shared/server/db/auth-schema';

const TEST_DB_URL =
    process.env.TEST_DATABASE_URL ||
    'postgres://colin:secure_password@localhost:5433/split_test?sslmode=disable';

// Create a connection for E2E tests (runs in Node.js, not workerd)
const client = postgres(TEST_DB_URL, { onnotice: () => { } });

export const e2eDb = drizzle(client, {
    schema: { ...schema, ...authSchema },
});

export async function resetDatabase() {
    for (const table of tablesToTruncate) {
        await e2eDb.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
    }
}

export async function closeDatabase() {
    await client.end();
}
