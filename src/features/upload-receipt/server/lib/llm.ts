import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createServerOnlyFn } from '@tanstack/react-start';

export const google = createServerOnlyFn(() => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is required');
  }
  return createGoogleGenerativeAI({
    apiKey,
  });
});
