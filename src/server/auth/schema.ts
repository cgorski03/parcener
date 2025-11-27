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
} satisfies BetterAuthOptions;
