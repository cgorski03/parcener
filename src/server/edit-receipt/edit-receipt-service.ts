import { eq } from "drizzle-orm";
import { db } from "../db";
import { receipt, receiptItem } from "../db/schema";
import { ReceiptItemDto, receiptItemEntityToDtoHelper, ReceiptTotalsDto } from "../dtos";
import { getReceiptWithItems, } from "../get-receipt/get-receipt-service";
import { isFailed, receiptNotFound, isProcessing } from "@/lib/receipt-utils";
import { ReceiptNotFoundResponse, ReceiptProcessingFailedResponse, ReceiptProcessingResponse } from "../response-types";

export async function editReceiptItem(item: ReceiptItemDto) {
    const [updatedItem] = await db.update(receiptItem).set({
        interpretedText: item.interpretedText,
        price: item.price.toString(),
        quantity: item.quantity.toString(),
    })
        .where(eq(receiptItem.id, item.id))
        .returning();
    return receiptItemEntityToDtoHelper(updatedItem);
}

export async function createReceiptItem(item: ReceiptItemDto, receiptId: string) {
    const [insertedItem] = await db.insert(receiptItem).values({
        id: item.id,
        receiptId: receiptId,
        interpretedText: item.interpretedText,
        price: item.price.toString(),
        quantity: item.quantity.toString(),
    })
        .returning();
    return receiptItemEntityToDtoHelper(insertedItem);
}

export async function deleteReceiptItem(item: ReceiptItemDto) {
    await db.delete(receiptItem)
        .where(eq(receiptItem.id, item.id));
}


type FinalizeReceiptResponse =
    | { success: true }
    | { error: true; code: 'SUBTOTAL_MISMATCH'; clientSubtotal: number; serverSubtotal: number }
    | { error: true; code: 'GRANDTOTAL_MISMATCH'; clientGrandTotal: number; serverGrandTotal: number }
    | ReceiptProcessingResponse | ReceiptProcessingFailedResponse | ReceiptNotFoundResponse;

export async function finalizeReceiptTotals(receiptTotals: ReceiptTotalsDto): Promise<FinalizeReceiptResponse> {
    // Truthfully, I don't know how I really want this behavior to be enforced.
    // But, I don't think you should be able to have a receipt and have people splitting where
    // the total is not equal to the sum of the items in the receipt
    // this will have to do for now, and I think that I will figure out the implementation now
    //
    // We are not trusting the client's calculated subtotal
    if (!receiptTotals) return { error: true, code: 'NOT_FOUND' }
    const { id, subtotal, tax, tip, grandTotal } = receiptTotals;
    // Get the current reciept information

    const receiptInformation = await getReceiptWithItems(id);

    if (receiptNotFound(receiptInformation) || !receiptInformation) {
        // Not found
        return {
            error: true,
            code: 'NOT_FOUND'
        }
    }

    if (isFailed(receiptInformation)) {
        return {
            error: true,
            code: 'FAILED',
            attempts: receiptInformation.attempts
        }
    }

    if (isProcessing(receiptInformation)) {
        return {
            error: true,
            code: 'PROCESSING'
        }
    }

    // We have a successful receipt
    const calculatedSubtotal = receiptInformation.items?.reduce((sum, item) => sum + item.price, 0)
    const EPSILON = 0.01;

    if (Math.abs(calculatedSubtotal - subtotal) > EPSILON) {
        return {
            error: true,
            code: "SUBTOTAL_MISMATCH",
            clientSubtotal: subtotal,
            serverSubtotal: calculatedSubtotal
        }
    }
    const calculatedGrandTotal = subtotal + tip + tax;

    // The clients desired grand total must match what the server calculates it to be 
    // If it exists. The client is also free to just submit a request and have the server do the math
    if (Math.abs(calculatedGrandTotal - grandTotal) > EPSILON) {
        return {
            error: true,
            code: 'GRANDTOTAL_MISMATCH',
            clientGrandTotal: grandTotal,
            serverGrandTotal: calculatedGrandTotal,
        }
    }

    await db.update(receipt).set({
        subtotal: subtotal.toString(),
        tip: tip.toString(),
        tax: tax.toString(),
        grandTotal: calculatedGrandTotal.toString(),
    }).where(eq(receipt.id, id));

    return {
        success: true
    }
}

