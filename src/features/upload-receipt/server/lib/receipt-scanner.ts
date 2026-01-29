import { generateText } from 'ai';
import { parseStructuredReceiptResponse } from '../utils/parse-json';
import { modelParsedReceiptSchema } from '../types';
import { RECEIPT_PARSE_PROMPT } from './prompts';
import type {
  GoogleGenerativeAIProvider,
  GoogleGenerativeAIProviderOptions,
} from '@ai-sdk/google';
import type { GoogleThinkingLevel } from '../types';

const MODEL_ID = 'gemini-3-flash-preview';

export async function scanReceiptImage(request: {
  imageBuffer: ArrayBuffer;
  thinkingLevel: GoogleThinkingLevel;
  ai: GoogleGenerativeAIProvider;
}) {
  const { imageBuffer, thinkingLevel, ai } = request;
  // 1. Call AI
  const { text, providerMetadata } = await generateText({
    model: ai(MODEL_ID),
    providerOptions: {
      google: {
        thinkingConfig: { thinkingLevel },
      } satisfies GoogleGenerativeAIProviderOptions,
    },
    temperature: 0.3,
    system: RECEIPT_PARSE_PROMPT,
    messages: [
      { role: 'user', content: [{ type: 'image', image: imageBuffer }] },
    ],
  });

  // 2. Parse (Zod validation happens here)
  const data = parseStructuredReceiptResponse(text, modelParsedReceiptSchema);

  // 3. Return clean interface
  return {
    data,
    rawText: text,
    providerMetadata,
    modelUsed: MODEL_ID,
  };
}
