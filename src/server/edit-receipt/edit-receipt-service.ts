import { and, eq, exists } from 'drizzle-orm'
import { receipt, receiptItem } from '../db/schema'
import {
    ReceiptItemDto,
    receiptItemEntityToDtoHelper,
    ReceiptTotalsDto,
} from '../dtos'
import { getReceiptWithItems } from '../get-receipt/get-receipt-service'
import { isFailed, receiptNotFound, isProcessing } from '@/lib/receipt-utils'
import {
    RECEIPT_PROCESSING_FAILED,
    NOT_FOUND,
    RECEIPT_PROCESSING,
    NotFoundResponse,
    ReceiptProcessingFailedResponse,
    ReceiptProcessingResponse,
    ReceiptGrandTotalMismatchResponse,
    ReceiptSubtotalMismatchResponse,
} from '../response-types'
import { calculateItemTotal, moneyValuesEqual } from '../money-math'
import { DbType } from '../db'

export function receiptItemOwnershipCheck(
    db: DbType,
    userId: string,
) {
    return exists(
        db
            .select({ id: receipt.id })
            .from(receipt)
            .where(
                and(
                    eq(receipt.id, receiptItem.receiptId),
                    eq(receipt.userId, userId),
                ),
            ),
    )
}

export async function editReceiptItem(db: DbType, item: ReceiptItemDto, userId: string) {
    // Ugly funciton to make sure that the user owns the receipt
    const [updatedItem] = await db
        .update(receiptItem)
        .set({
            interpretedText: item.interpretedText,
            price: item.price.toString(),
            quantity: item.quantity.toString(),
        })
        .where(
            and(
                eq(receiptItem.id, item.receiptItemId),
                receiptItemOwnershipCheck(db, userId)
            )
        )
        .returning()
    return receiptItemEntityToDtoHelper(updatedItem)
}

export async function createReceiptItem(
    db: DbType,
    item: ReceiptItemDto,
    receiptId: string,
    userId: string,
) {

    const obj = db.select({ id: receipt.id })
        .from(receipt)
        .where(
            and(
                eq(receipt.id, receiptItem.receiptId),
                eq(receipt.userId, userId)
            )
        )

    if (!obj) {
        throw new Error('Receipt not found or unauthorized');
    }

    const [insertedItem] = await db
        .insert(receiptItem)
        .values({
            id: item.receiptItemId,
            receiptId: receiptId,
            interpretedText: item.interpretedText,
            price: item.price.toString(),
            quantity: item.quantity.toString(),
        })
        .returning()
    return receiptItemEntityToDtoHelper(insertedItem)
}

export async function deleteReceiptItem(db: DbType, item: ReceiptItemDto, userId: string) {
    await db.delete(receiptItem)
        .where(
            and(
                eq(receiptItem.id, item.receiptItemId),
                receiptItemOwnershipCheck(db, userId)
            )
        )
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

    await db
        .update(receipt)
        .set({
            subtotal: subtotal.toString(),
            tip: tip.toString(),
            tax: tax.toString(),
            grandTotal: calculatedGrandTotal.toString(),
        })
        .where(and(eq(receipt.id, receiptId), eq(receipt.userId, userId)))

    return {
        success: true,
    }
}
