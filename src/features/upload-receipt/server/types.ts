import z from 'zod';
import type { GoogleGenerativeAIProvider } from '@ai-sdk/google';

export const googleThinkingLevelSchema = z
  .enum(['low', 'medium', 'high'])
  .default('medium');

export const uploadReceiptSchema = z
  .instanceof(FormData)
  .transform((formData) => {
    const file = formData.get('file');
    const thinkingLevel = formData.get('thinkingLevel');

    if (!(file instanceof File)) {
      throw new Error('File is required');
    }

    const parsedLevel = googleThinkingLevelSchema.parse(
      typeof thinkingLevel === 'string' ? thinkingLevel : undefined,
    );

    return { file, thinkingLevel: parsedLevel };
  });

export const modelParsedReceiptItemSchema = z.object({
  rawText: z.string().min(1),
  interpreted: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().positive().default(1),
  taxCode: z.string().min(1).nullable().optional().default(null),
  itemizedTaxStatus: z
    .enum(['taxable', 'exempt', 'unknown'])
    .nullable()
    .optional()
    .default(null),
});

export const modelParsedTaxCodeSchema = z.object({
  code: z.string().min(1).max(16),
  label: z.string().min(1).max(127).nullable().optional().default(null),
  rateBps: z.number().int().nonnegative().nullable().optional().default(null),
});

export const modelParsedMiscFeeSchema = z.object({
  rawText: z.string().min(1),
  interpreted: z.string().min(1).max(127),
  amount: z.number().nonnegative(),
});

export const modelParsedReceiptSchema = z.object({
  items: z
    .array(modelParsedReceiptItemSchema)
    .min(1, 'Receipt must have at least one item'),
  taxAllocationMode: z
    .enum(['receipt_level', 'itemized'])
    .optional()
    .default('receipt_level'),
  taxCodes: z.array(modelParsedTaxCodeSchema).optional().default([]),
  miscFees: z.array(modelParsedMiscFeeSchema).optional().default([]),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative().default(0),
  tip: z.number().nonnegative().default(0),
  total: z.number().positive(),
  metadata: z
    .object({
      restaurant: z.string().nullish(),
      date: z.string().nullish(),
    })
    .optional()
    .default({ restaurant: 'Unnamed', date: new Date().toISOString() }),
});

export type ModelParsedReceiptType = z.infer<typeof modelParsedReceiptSchema>;
export type GoogleThinkingLevel = z.infer<typeof googleThinkingLevelSchema>;

// AI SDK Types
// Not exported from SDK
export type GoogleGenerativeAIModelId =
  Parameters<GoogleGenerativeAIProvider>[0];

export type ReceiptJob = {
  receiptId: string;
  thinkingLevel: GoogleThinkingLevel;
  __sentry_trace?: string;
  __sentry_baggage?: string;
};
