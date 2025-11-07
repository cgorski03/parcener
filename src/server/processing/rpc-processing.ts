import { createServerFn } from "@tanstack/react-start";
import { db } from "../db";
import { receipt, receiptItem, ReceiptItemInsert } from "../db/schema";
import { google } from "../llm";
import { parseReceiptItems } from "./processing-service";

export const uploadReceipt = createServerFn({ method: 'POST' })
    .inputValidator((data: FormData) => data)
    .handler(async ({ data }) => {
        const file = data.get('file') as File;
        const buffer = await file.arrayBuffer();
        const createdBy = data.get('createdBy') as string;

        if (!file) throw new Error('No file provided');
        if (!createdBy) throw new Error('Name required');

        const ai = google();
        const parsed = await parseReceiptItems(ai, buffer);
        const receiptId = crypto.randomUUID();

        await db.insert(receipt).values({
            id: receiptId,
            title: parsed.metadata.restaurant ?? 'No Title',
            subtotal: parsed.subtotal?.toString() ?? null,
            tax: parsed.tax?.toString() ?? null,
            tip: parsed.tip?.toString() ?? null,
            grandTotal: parsed.total?.toString() ?? null,
            rawResponse: JSON.stringify(parsed),
        });

        const itemDbObject: ReceiptItemInsert[] = parsed.items.map((item) => (
            {
                receiptId: receiptId,
                price: item.price?.toString() ?? null,
                rawText: item.rawText,
                interpretedText: item.interpreted,
                quantity: item.quantity.toString(),
            }
        ))
        await db.insert(receiptItem).values(itemDbObject);
        return { receiptId: receiptId }
    });
