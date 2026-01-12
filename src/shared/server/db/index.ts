import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createServerOnlyFn } from '@tanstack/react-start';
import * as authSchema from './auth-schema';
import * as schema from './schema';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';

type FullSchema = typeof schema & typeof authSchema;

// EXPORTS

export const getDb = createServerOnlyFn((env: any) => {
  const client = postgres(env.HYPERDRIVE.connectionString);

  return drizzle(client, {
    schema: { ...schema, ...authSchema },
  });
});

export * from './auth-schema';
export * as authSchema from './auth-schema';

export * from './schema';

// 2. Define the DbType (Standard DB instance)
export type DbType = ReturnType<typeof getDb>;

// 3. Define the Transaction Type
export type DbTxType = PgTransaction<
  PostgresJsQueryResultHKT,
  FullSchema,
  ExtractTablesWithRelations<FullSchema>
>;
