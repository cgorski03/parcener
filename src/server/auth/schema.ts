import { BetterAuthOptions } from "better-auth";

export const authConfig = {
    emailAndPassword: {
        enabled: false,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
    },
    user: {
        additionalFields: {
            canUpload: {
                type: "boolean",
                defaultValue: false,
                input: false,
            },
        },
    },
    // This is an attempt to fix a safari specific oauth bug
    advanced: {
        useSecureCookies: true,
        defaultCookieAttributes: {
            sameSite: 'lax',
            secure: true,
            httpOnly: true,
        }
    }
} satisfies BetterAuthOptions;

