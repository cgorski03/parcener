import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { authSchema, DbType } from "./db";

export const createAuth = (db: DbType) => {
    return betterAuth({
        emailAndPassword: {
            enabled: false
        },
        socialProviders: {
            google: {
                clientId: process.env.GOOGLE_CLIENT_ID as string,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            },
        },
        database: drizzleAdapter(db, {
            schema: authSchema,
            provider: "pg",
        }),
    });
}
