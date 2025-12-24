import { ReceiptDto } from '../dtos'
import {
    NOT_FOUND,
    RECEIPT_PROCESSING,
    RECEIPT_PROCESSING_FAILED,
    ReceiptGrandTotalMismatchResponse,
    NotFoundResponse,
    ReceiptProcessingFailedResponse,
    ReceiptProcessingResponse,
    ReceiptSubtotalMismatchResponse,
} from '../response-types'
import { isFailed, isProcessing, receiptNotFound } from '@/lib/receipt-utils'
import { validateReceiptCalculations } from '../money-math'
import { DbType, receipt } from '../db'
import { and, desc, eq } from 'drizzle-orm'
import { receiptWithItemsToDto } from '../dto-mappers'

export type ReceiptWithRoom = ReceiptDto & { roomId?: string }

export type GetReceiptResponse =
    | NotFoundResponse
    | ReceiptProcessingResponse
    | ReceiptProcessingFailedResponse
    | ReceiptWithRoom

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
            items: true,
            room: true,
            processingInfo: true,
        },
    })
}

export async function getUserRecentReceiptsHelper(
    db: DbType,
    limit: number,
    userId: string,
) {
    return await db.query.receipt.findMany({
        orderBy: desc(receipt.createdAt),
        where: eq(receipt.userId, userId),
        limit,
        with: {
            items: true,
            processingInfo: true,
        },
    })
}
