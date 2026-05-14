import { eq } from 'drizzle-orm';
import type { GoogleThinkingLevel, ModelParsedReceiptType } from './types';
import {
  buildReceiptFeeRows,
  buildReceiptItemRows,
  buildTaxCodeRows,
} from './parsed-receipt-mappers';
import type { DbType, ReceiptValidityState } from '@/shared/server/db';
import {
  receipt,
  receiptFees,
  receiptItem,
  receiptItemTaxClassification,
  receiptProcessingInformation,
  taxCode,
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
  request: {
    model: string;
    tokens: number | null;
    rawModelResponse: string;
    initialValidityStatus: ReceiptValidityState;
  },
) {
  await db
    .update(receiptProcessingInformation)
    .set({
      endedAt: new Date(),
      processingStatus: 'success',
      model: request.model,
      processingTokens: request.tokens,
      rawResponse: request.rawModelResponse,
      initialValidityStatus: request.initialValidityStatus,
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
  await db.transaction(async (tx) => {
    await tx
      .update(receipt)
      .set({
        title: parsedReceipt.metadata.restaurant ?? 'No Title',
        subtotal: parsedReceipt.subtotal.toString(),
        tax: parsedReceipt.tax.toString(),
        tip: parsedReceipt.tip.toString(),
        grandTotal: parsedReceipt.total.toString(),
        taxAllocationMode: parsedReceipt.taxAllocationMode,
      })
      .where(eq(receipt.id, id));

    const newTaxCodes = buildTaxCodeRows(id, parsedReceipt.taxCodes);
    const insertedTaxCodes =
      newTaxCodes.length > 0
        ? await tx.insert(taxCode).values(newTaxCodes).returning()
        : [];

    const taxCodeIdByCode = new Map(
      insertedTaxCodes.map((insertedCode) => [
        insertedCode.code,
        insertedCode.id,
      ]),
    );

    const { newReceiptItems, newReceiptItemTaxClassifications } =
      buildReceiptItemRows({
        receiptId: id,
        parsedReceipt,
        taxCodeIdByCode,
      });

    await tx.insert(receiptItem).values(newReceiptItems);

    if (newReceiptItemTaxClassifications.length > 0) {
      await tx
        .insert(receiptItemTaxClassification)
        .values(newReceiptItemTaxClassifications);
    }

    const newReceiptFees = buildReceiptFeeRows(id, parsedReceipt.miscFees);
    if (newReceiptFees.length > 0) {
      await tx.insert(receiptFees).values(newReceiptFees);
    }
  });
}
