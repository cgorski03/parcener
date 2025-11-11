import { eq } from "drizzle-orm";
import { db } from "../db";
import { receiptItem } from "../db/schema";
import { ReceiptItemDto, receiptItemEntityToDtoHelper } from "../dtos";

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

