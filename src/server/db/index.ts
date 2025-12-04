import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import * as authSchema from './auth-schema'

export const getDb = (env: any) => {
    const connectionString =
        process.env.NODE_ENV === 'development'
            ? process.env.DIRECT_DATABASE_URL
            : env.HYPERDRIVE.connectionString

    const client = postgres(connectionString)

    return drizzle(client, {
        schema: { ...schema, ...authSchema },
    })
}

export * from './schema'
export * from './auth-schema'
export * as authSchema from './auth-schema'
export type DbType = ReturnType<
    typeof drizzle<typeof schema & typeof authSchema>
>
