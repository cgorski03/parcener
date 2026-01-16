import { eq } from 'drizzle-orm';
import type { GoogleThinkingLevel, ModelParsedReceiptType } from './types';
import type { DbType, NewReceiptItem } from '@/shared/server/db';
import {
  receipt,
  receiptItem,
  receiptProcessingInformation,
} from '@/shared/server/db';

// Returns what is effectively the processing run ID
export async function createProcessingStub(request: {
  db: DbType;
  receiptId: string;
  thinkingLevel: GoogleThinkingLevel;
}) {
  const { db, receiptId, thinkingLevel } = request;

  const startTime = new Date();
  const [insertedRecord] = await db
    .insert(receiptProcessingInformation)
    .values({
      receiptId,
      startedAt: startTime,
      processingStatus: 'processing',
      thinkingLevel,
    })
    .returning();
  return insertedRecord.id;
}

export async function finishReceiptProcessingRunSuccess(
  db: DbType,
  runId: string,
  request: { model: string; tokens: number | null; rawModelResponse: string },
) {
  await db
    .update(receiptProcessingInformation)
    .set({
      endedAt: new Date(),
      processingStatus: 'success',
      model: request.model,
      processingTokens: request.tokens,
      rawResponse: request.rawModelResponse,
    })
    .where(eq(receiptProcessingInformation.id, runId));
}

export async function createProcessingError(
  db: DbType,
  request: {
    runId: string;
    modelUsed?: string;
    processingTokens?: number;
    rawModelResponse?: string;
  },
  err: Error | unknown,
) {
  await db
    .update(receiptProcessingInformation)
    .set({
      endedAt: new Date(),
      processingStatus: 'failed',
      model: request.modelUsed,
      processingTokens: request.processingTokens,
      rawResponse: request.rawModelResponse,
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
      errorDetails: String(err),
    })
    .where(eq(receiptProcessingInformation.id, request.runId));
}

type SaveReceiptRequest = {
  id: string;
  parsedReceipt: ModelParsedReceiptType;
};
export async function saveReceiptInformation(
  db: DbType,
  request: SaveReceiptRequest,
) {
  const { id, parsedReceipt } = request;
  await db
    .update(receipt)
    .set({
      title: parsedReceipt.metadata.restaurant ?? 'No Title',
      subtotal: parsedReceipt.subtotal.toString(),
      tax: parsedReceipt.tax.toString(),
      tip: parsedReceipt.tip.toString(),
      grandTotal: parsedReceipt.total.toString(),
    })
    .where(eq(receipt.id, id));

  const itemDbObject: Array<NewReceiptItem> = parsedReceipt.items.map(
    (item, index) => ({
      receiptId: id,
      price: item.price.toString(),
      rawText: item.rawText,
      interpretedText: item.interpreted,
      modelInterpretedText: item.interpreted,
      quantity: item.quantity.toString(),
      orderIndex: index,
    }),
  );
  await db.insert(receiptItem).values(itemDbObject);
}
