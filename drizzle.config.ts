import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    dialect: 'postgresql',
    schema: './src/server/db/drizzle-kit.ts',
    out: './drizzle',
    dbCredentials: {
        url: process.env.DIRECT_DATABASE_URL
    },
})
