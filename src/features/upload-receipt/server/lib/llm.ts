import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createServerOnlyFn } from '@tanstack/react-start';
import { env } from 'cloudflare:workers';

export const google = createServerOnlyFn(() => {
  const apiKey = env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is required');
  }
  return createGoogleGenerativeAI({
    apiKey,
  });
});
