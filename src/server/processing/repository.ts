import {
  receipt,
  receiptItem,
  receiptProcessingInformation,
  type ReceiptItemInsert,
} from '../db/schema'
import { eq } from 'drizzle-orm'
import { ParsedReceipt } from './types'
import { DbType } from '../db'

// Returns what is effectively the processing run ID
export async function createProcessingStub(db: DbType, id: string) {
  const startTime = new Date()
  const [insertedRecord] = await db
    .insert(receiptProcessingInformation)
    .values({
      receiptId: id,
      startedAt: startTime,
      processingStatus: 'processing',
    })
    .returning()
  return insertedRecord.id
}

export async function finishReceiptProcessingRunSuccess(
  db: DbType,
  runId: string,
  request: { model: string; tokens: number | null },
) {
  await db
    .update(receiptProcessingInformation)
    .set({
      endedAt: new Date(),
      processingStatus: 'success',
      model: request.model,
      processingTokens: request.tokens,
    })
    .where(eq(receiptProcessingInformation.id, runId))
}
export async function createProcessingError(
  db: DbType,
  request: {
    runId: string
    model?: string
    processingTokens?: number
  },
  err: Error | unknown,
) {
  console.log('Creating processing error record for ', request.runId)
  await db
    .update(receiptProcessingInformation)
    .set({
      endedAt: new Date(),
      processingStatus: 'failed',
      model: request.model,
      processingTokens: request.processingTokens,
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
      errorDetails: String(err),
    })
    .where(eq(receiptProcessingInformation.id, request.runId))
}

export async function saveReceiptInformation(
  db: DbType,
  receiptId: string,
  parsedReceipt: ParsedReceipt,
) {
  await db
    .update(receipt)
    .set({
      title: parsedReceipt.metadata.restaurant ?? 'No Title',
      subtotal: parsedReceipt.subtotal?.toString() ?? null,
      tax: parsedReceipt.tax?.toString() ?? null,
      tip: parsedReceipt.tip?.toString() ?? null,
      grandTotal: parsedReceipt.total?.toString() ?? null,
      rawResponse: JSON.stringify(parsedReceipt),
    })
    .where(eq(receipt.id, receiptId))

  const itemDbObject: ReceiptItemInsert[] = parsedReceipt.items.map((item) => ({
    receiptId: receiptId,
    price: item.price?.toString() ?? null,
    rawText: item.rawText,
    interpretedText: item.interpreted,
    modelInterpretedText: item.interpreted,
    quantity: item.quantity.toString(),
  }))
  await db.insert(receiptItem).values(itemDbObject)
}
