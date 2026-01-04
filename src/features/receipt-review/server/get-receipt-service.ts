import {
    GetReceiptResponse,
    RECEIPT_PROCESSING,
    RECEIPT_PROCESSING_FAILED,
    ReceiptGrandTotalMismatchResponse,
    ReceiptProcessingFailedResponse,
    ReceiptProcessingResponse,
    ReceiptSubtotalMismatchResponse,
} from './responses'
import { DbType, receipt } from '@/shared/server/db'
import { and, eq } from 'drizzle-orm'
import type { ReceiptDto } from '@/shared/dto/types'
import { receiptWithItemsToDto } from '@/shared/dto/mappers'
import { NOT_FOUND, NotFoundResponse } from '@/shared/server/response-types'
import { isFailed, isProcessing, receiptNotFound } from '../lib/receipt-utils'
import { validateReceiptCalculations } from '@/shared/lib/money-math'

export type ReceiptWithRoom = ReceiptDto & { roomId?: string }


export async function getReceiptWithItems(
    db: DbType,
    receiptId: string,
    userId: string,
): Promise<GetReceiptResponse> {
    const receiptInformation = await getReceiptWithRelationsHelper(
        db,
        receiptId,
        userId,
    )

    if (!receiptInformation) {
        return NOT_FOUND;
    }
    // Prevent race condition - essentially count the queue as processing
    if (receiptInformation.processingInfo.length === 0 || receiptInformation?.processingInfo.some(
        (x) => x.processingStatus === 'processing')) {
        return RECEIPT_PROCESSING;
    }

    const hasSuccesses = receiptInformation.processingInfo.some(
        (receipt) => receipt.processingStatus === 'success',
    );

    // have we failed, and dont have a success or a processing
    if (!hasSuccesses && receiptInformation.processingInfo.length > 0) {
        const failedAttemptsCount = receiptInformation.processingInfo.filter(
            (info) => info.processingStatus === 'failed',
        ).length;

        if (failedAttemptsCount === receiptInformation.processingInfo.length) {
            return RECEIPT_PROCESSING_FAILED(failedAttemptsCount);
        }
    }
    const receiptDto = receiptWithItemsToDto(receiptInformation);

    if (receiptInformation.room) {
        return {
            ...receiptDto,
            roomId: receiptInformation.room.id,
        }
    }
    return receiptDto;
}

export type GetReceiptIsValidResponse =
    | { success: true; receipt: ReceiptDto }
    | NotFoundResponse
    | ReceiptProcessingResponse
    | ReceiptProcessingFailedResponse
    | ReceiptSubtotalMismatchResponse
    | ReceiptGrandTotalMismatchResponse

export async function getReceiptIsValid(
    db: DbType,
    receiptId: string,
    userId: string,
): Promise<GetReceiptIsValidResponse> {
    // Will return true if a receipt is valid
    const receiptInformation = await getReceiptWithItems(db, receiptId, userId)

    if (receiptNotFound(receiptInformation) || !receiptInformation) {
        // Not found
        return NOT_FOUND
    }
    if (isFailed(receiptInformation)) {
        return RECEIPT_PROCESSING_FAILED(receiptInformation.attempts)
    }
    if (isProcessing(receiptInformation)) {
        return RECEIPT_PROCESSING
    }
    const validationResult = validateReceiptCalculations(receiptInformation);

    if (!validationResult.isValid) {
        // Map validation error to API response format
        const { error } = validationResult;
        if (error.code === "SUBTOTAL_MISMATCH") {
            return {
                error: true,
                code: error.code,
                clientSubtotal: error.clientSubtotal,
                serverSubtotal: error.serverSubtotal,
            };
        } else {
            return {
                error: true,
                code: error.code,
                clientGrandTotal: error.clientGrandTotal,
                serverGrandTotal: error.serverGrandTotal,
            };
        }
    }

    return { success: true, receipt: receiptInformation };
}


async function getReceiptWithRelationsHelper(
    db: DbType,
    receiptId: string,
    userId: string,
) {
    return await db.query.receipt.findFirst({
        where: and(eq(receipt.id, receiptId), eq(receipt.userId, userId)),
        with: {
            items: {
                orderBy: (items, { asc }) => [asc(items.orderIndex)],
            },
            room: true,
            processingInfo: true,
        }
    });
}

