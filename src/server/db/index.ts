import { drizzle, PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import * as authSchema from './auth-schema'
import { ExtractTablesWithRelations } from 'drizzle-orm'
import { PgTransaction } from 'drizzle-orm/pg-core'
import { createServerOnlyFn } from '@tanstack/react-start'

export const getDb = createServerOnlyFn((env: any) => {
    const client = postgres(env.HYPERDRIVE.connectionString)

    return drizzle(client, {
        schema: { ...schema, ...authSchema },
    })
});

export * from './schema'
export * from './auth-schema'
export * as authSchema from './auth-schema'

type FullSchema = typeof schema & typeof authSchema;

// 2. Define the DbType (Standard DB instance)
export type DbType = ReturnType<typeof getDb>;

// 3. Define the Transaction Type
export type DbTxType = PgTransaction<
    PostgresJsQueryResultHKT,
    FullSchema,
    ExtractTablesWithRelations<FullSchema>
>;
