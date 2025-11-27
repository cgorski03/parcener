import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { authConfig } from "./schema";

const client = postgres(process.env.DIRECT_DATABASE_URL || "postgres://fake");
const db = drizzle(client);

export const auth = betterAuth({
    ...authConfig,
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
});
