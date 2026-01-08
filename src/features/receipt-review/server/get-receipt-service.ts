import {
    GetReceiptResponse,
    RECEIPT_PROCESSING,
    RECEIPT_PROCESSING_FAILED,
} from './responses'
import { DbType, receipt } from '@/shared/server/db'
import { and, eq } from 'drizzle-orm'
import type { ReceiptDto } from '@/shared/dto/types'
import { receiptWithItemsToDto } from '@/shared/dto/mappers'
import { NOT_FOUND } from '@/shared/server/response-types'
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

export type ReceiptState =
    | { status: 'valid'; receipt: ReceiptDto }
    | { status: 'not_found' }
    | { status: 'processing' }
    | { status: 'failed'; attempts: number }
    | { status: 'subtotal_mismatch'; receipt: ReceiptDto; clientSubtotal: number; serverSubtotal: number }
    | { status: 'grandtotal_mismatch'; receipt: ReceiptDto; clientGrandTotal: number; serverGrandTotal: number }

export async function getReceiptState(
    db: DbType,
    receiptId: string,
    userId: string,
): Promise<ReceiptState> {
    const receipt = await getReceiptWithItems(db, receiptId, userId)

    if (receiptNotFound(receipt) || !receipt) {
        return { status: 'not_found' }
    }
    if (isFailed(receipt)) {
        return { status: 'failed', attempts: receipt.attempts }
    }
    if (isProcessing(receipt)) {
        return { status: 'processing' }
    }

    const validation = validateReceiptCalculations(receipt)

    if (!validation.isValid) {
        const { error } = validation
        if (error.code === 'SUBTOTAL_MISMATCH') {
            return {
                status: 'subtotal_mismatch',
                receipt,
                clientSubtotal: error.clientSubtotal,
                serverSubtotal: error.serverSubtotal,
            }
        }
        return {
            status: 'grandtotal_mismatch',
            receipt,
            clientGrandTotal: error.clientGrandTotal,
            serverGrandTotal: error.serverGrandTotal,
        }
    }

    return { status: 'valid', receipt }
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

