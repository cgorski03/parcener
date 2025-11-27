import { receiptEntityWithReferencesToDtoHelper, ReceiptDto, NullableReceiptDto } from '../dtos'
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
import { calculateItemTotal, moneyValuesEqual } from '../money-math'
import { DbType, receipt } from '../db'
import { and, eq } from 'drizzle-orm'

export type GetReceiptResponse =
    | NotFoundResponse
    | ReceiptProcessingResponse
    | ReceiptProcessingFailedResponse
    | NullableReceiptDto

export async function getReceiptWithItems(
    db: DbType,
    receiptId: string,
    userId: string,
): Promise<GetReceiptResponse> {
    const receiptInformation = await getReceiptWithItemsHelper(
        db,
        receiptId,
        userId,
    )
    if (!receiptInformation) {
        return NOT_FOUND
    }
    if (
        receiptInformation?.processingInfo.some(
            (x) => x.processingStatus === 'processing',
        )
    ) {
        return RECEIPT_PROCESSING
    }

    const hasSuccesses = receiptInformation.processingInfo.some(
        (receipt) => receipt.processingStatus === 'success',
    )
    // have we failed, and dont have a success or a processing

    if (!hasSuccesses && receiptInformation.processingInfo.length > 0) {
        const failedAttemptsCount = receiptInformation.processingInfo.filter(
            (info) => info.processingStatus === 'failed',
        ).length

        if (failedAttemptsCount === receiptInformation.processingInfo.length) {
            return RECEIPT_PROCESSING_FAILED(failedAttemptsCount)
        }
    }

    return receiptEntityWithReferencesToDtoHelper(receiptInformation)
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
    const calculatedSubtotal = calculateItemTotal(receiptInformation.items)

    if (!moneyValuesEqual(receiptInformation.subtotal, calculatedSubtotal)) {
        return {
            error: true,
            code: 'SUBTOTAL_MISMATCH',
            clientSubtotal: calculatedSubtotal,
            serverSubtotal: receiptInformation.subtotal,
        }
    }
    const calculatedGrandTotal =
        receiptInformation.subtotal +
        receiptInformation.tax +
        receiptInformation.tip

    if (
        !moneyValuesEqual(receiptInformation.grandTotal ?? 0, calculatedGrandTotal)
    ) {
        return {
            error: true,
            code: 'GRANDTOTAL_MISMATCH',
            clientGrandTotal: calculatedGrandTotal,
            serverGrandTotal: receiptInformation.grandTotal,
        }
    }
    return { success: true, receipt: receiptInformation }
}

async function getReceiptWithItemsHelper(
    db: DbType,
    receiptId: string,
    userId: string,
) {
    return await db.query.receipt.findFirst({
        where: and(eq(receipt.id, receiptId), eq(receipt.userId, userId)),
        with: {
            items: true,
            processingInfo: true,
        },
    })
}
