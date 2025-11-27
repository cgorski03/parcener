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
    request: { model: string; tokens: number | null; rawModelResponse: string; },
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
        .where(eq(receiptProcessingInformation.id, runId))
}

export async function createProcessingError(
    db: DbType,
    request: {
        runId: string;
        model?: string;
        processingTokens?: number;
        rawModelResponse?: string;
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
            rawResponse: request.rawModelResponse,
            errorMessage: err instanceof Error ? err.message : 'Unknown error',
            errorDetails: String(err),
        })
        .where(eq(receiptProcessingInformation.id, request.runId))
}

type SaveReceiptRequest = {
    id: string,
    parsedReceipt: ParsedReceipt,
}
export async function saveReceiptInformation(
    db: DbType,
    request: SaveReceiptRequest
) {
    const { id, parsedReceipt } = request;
    await db
        .update(receipt)
        .set({
            title: parsedReceipt.metadata.restaurant ?? 'No Title',
            subtotal: parsedReceipt.subtotal?.toString() ?? null,
            tax: parsedReceipt.tax?.toString() ?? null,
            tip: parsedReceipt.tip?.toString() ?? null,
            grandTotal: parsedReceipt.total?.toString() ?? null,
        })
        .where(eq(receipt.id, id))

    const itemDbObject: ReceiptItemInsert[] = parsedReceipt.items.map((item) => ({
        receiptId: id,
        price: item.price?.toString() ?? null,
        rawText: item.rawText,
        interpretedText: item.interpreted,
        modelInterpretedText: item.interpreted,
        quantity: item.quantity.toString(),
    }))
    await db.insert(receiptItem).values(itemDbObject)
}
