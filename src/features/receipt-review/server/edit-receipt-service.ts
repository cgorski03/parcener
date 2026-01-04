import { and, eq, exists } from 'drizzle-orm'
import { receipt, receiptItem } from '@/shared/server/db/schema'
import {
    CreateReceiptItemDto,
    ReceiptItemDto,
    ReceiptTotalsDto,
} from '@/shared/dto/types'
import { getReceiptWithItems } from './get-receipt-service'
import {
    RECEIPT_PROCESSING_FAILED,
    NOT_FOUND,
    RECEIPT_PROCESSING,
    NotFoundResponse,
    ReceiptProcessingFailedResponse,
    ReceiptProcessingResponse,
    ReceiptGrandTotalMismatchResponse,
    ReceiptSubtotalMismatchResponse,
} from '@/shared/server/response-types'
import { DbTxType, DbType } from '@/shared/server/db'
import { pruneExcessClaimsHelper } from '@/features/room/server/room-claims-service'
import { touchRoomFromReceipt } from '@/features/room/server/room-service'
import { receiptItemEntityToDtoHelper } from '@/shared/dto/mappers'
import { isFailed, isProcessing, receiptNotFound } from '../lib/receipt-utils'
import { calculateItemTotal, moneyValuesEqual } from '@/shared/lib/money-math'

export function receiptItemOwnershipCheck(
    db: DbTxType | DbType,
    userId: string,
) {
    return exists(
        db
            .select({ id: receipt.id })
            .from(receipt)
            .where(
                and(eq(receipt.id, receiptItem.receiptId), eq(receipt.userId, userId)),
            ),
    )
}

export async function editReceiptItem(
    db: DbType,
    item: ReceiptItemDto,
    userId: string,
) {
    return await db.transaction(async (tx) => {
        // TODO clean up architecture.
        // This is to handle the issue where an item has 4 claims for quantity 4 and you
        // change the quantity to 3 - what happens to the last claim
        // we basically do first-write-wins
        // cut the most recent ones until it works
        await pruneExcessClaimsHelper(tx, item.receiptItemId, item.quantity)
        const [updatedItem] = await tx
            .update(receiptItem)
            .set({
                interpretedText: item.interpretedText,
                price: item.price.toString(),
                quantity: item.quantity.toString(),
            })
            .where(
                and(
                    eq(receiptItem.id, item.receiptItemId),
                    receiptItemOwnershipCheck(tx, userId),
                ),
            )
            .returning()

        if (updatedItem) {
            // 2. Touch the room (if it exists)
            await touchRoomFromReceipt(tx, updatedItem.receiptId)
        }
        return receiptItemEntityToDtoHelper(updatedItem)
    })
}

export async function createReceiptItem(
    db: DbType,
    item: CreateReceiptItemDto,
    receiptId: string,
    userId: string,
) {
    const obj = db
        .select({ id: receipt.id })
        .from(receipt)
        .where(
            and(eq(receipt.id, receiptItem.receiptId), eq(receipt.userId, userId)),
        )

    if (!obj) {
        throw new Error('Receipt not found or unauthorized')
    }

    return await db.transaction(async (tx) => {
        const [insertedItem] = await tx
            .insert(receiptItem)
            .values({
                receiptId: receiptId,
                interpretedText: item.interpretedText,
                price: item.price.toString(),
                quantity: item.quantity.toString(),
            })
            .returning()

        // Touch the room
        await touchRoomFromReceipt(tx, receiptId)

        return receiptItemEntityToDtoHelper(insertedItem)
    })
}

export async function deleteReceiptItem(
    db: DbType,
    item: ReceiptItemDto,
    userId: string,
) {
    await db.transaction(async (tx) => {
        const itemToDelete = await tx.query.receiptItem.findFirst({
            where: eq(receiptItem.id, item.receiptItemId),
            columns: { receiptId: true },
        })

        if (!itemToDelete) return

        await tx
            .delete(receiptItem)
            .where(
                and(
                    eq(receiptItem.id, item.receiptItemId),
                    receiptItemOwnershipCheck(tx, userId),
                ),
            )
        await touchRoomFromReceipt(tx, itemToDelete.receiptId)
    })
}

type FinalizeReceiptResponse =
    | { success: true }
    | ReceiptSubtotalMismatchResponse
    | ReceiptGrandTotalMismatchResponse
    | ReceiptProcessingResponse
    | ReceiptProcessingFailedResponse
    | NotFoundResponse

export async function finalizeReceiptTotals(
    db: DbType,
    receiptTotals: ReceiptTotalsDto,
    userId: string,
): Promise<FinalizeReceiptResponse> {
    // Truthfully, I don't know how I really want this behavior to be enforced.
    // But, I don't think you should be able to have a receipt and have people splitting where
    // the total is not equal to the sum of the items in the receipt
    // this will have to do for now, and I think that I will figure out the implementation now
    //
    // We are not trusting the client's calculated subtotal
    if (!receiptTotals) return { error: true, code: 'NOT_FOUND' }
    const { receiptId, subtotal, tax, tip, grandTotal } = receiptTotals
    // Get the current reciept information

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

    // We have a successful receipt
    const calculatedSubtotal = calculateItemTotal(receiptInformation.items)

    if (!moneyValuesEqual(calculatedSubtotal, subtotal)) {
        return {
            error: true,
            code: 'SUBTOTAL_MISMATCH',
            clientSubtotal: subtotal,
            serverSubtotal: calculatedSubtotal,
        }
    }
    const calculatedGrandTotal = subtotal + tip + tax

    // The clients desired grand total must match what the server calculates it to be
    // If it exists. The client is also free to just submit a request and have the server do the math
    if (!moneyValuesEqual(calculatedGrandTotal, grandTotal)) {
        return {
            error: true,
            code: 'GRANDTOTAL_MISMATCH',
            clientGrandTotal: grandTotal,
            serverGrandTotal: calculatedGrandTotal,
        }
    }

    await db.transaction(async (tx) => {
        await tx
            .update(receipt)
            .set({
                subtotal: subtotal.toString(),
                tip: tip.toString(),
                tax: tax.toString(),
                grandTotal: calculatedGrandTotal.toString(),
            })
            .where(and(eq(receipt.id, receiptId), eq(receipt.userId, userId)))

        // Touch the room
        await touchRoomFromReceipt(tx, receiptId)
    })
    return { success: true }
}
