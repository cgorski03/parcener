import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';

// Support both Vite (browser) and Node.js (Playwright) environments
const baseURL =
  typeof import.meta.env !== 'undefined'
    ? import.meta.env.VITE_BASE_URL
    : process.env.VITE_BASE_URL ?? 'http://localhost:3000';

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    inferAdditionalFields({
      user: {
        canUpload: {
          type: 'boolean',
        },
      },
    }),
  ],
});
