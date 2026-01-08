import {
    receipt,
    receiptItem,
    receiptProcessingInformation,
} from '@/shared/server/db/schema';
import { testDb } from '../setup';

type ReceiptOverrides = Partial<typeof receipt.$inferInsert>;
type ReceiptItemInput = {
    interpretedText: string;
    price: number;
    quantity?: number;
};
type ProcessingStatus = 'processing' | 'success' | 'failed';

let receiptCounter = 0;

export async function createTestReceipt(
    userId: string,
    overrides: ReceiptOverrides = {},
    options: {
        items?: ReceiptItemInput[];
        status?: ProcessingStatus;
    } = {},
) {
    receiptCounter++;

    const [created] = await testDb
        .insert(receipt)
        .values({
            userId,
            title: overrides.title ?? `Test Receipt ${receiptCounter}`,
            subtotal: overrides.subtotal ?? '0',
            tip: overrides.tip ?? '0',
            tax: overrides.tax ?? '0',
            grandTotal: overrides.grandTotal ?? '0',
        })
        .returning();

    // Add processing information if status provided
    if (options.status) {
        await testDb.insert(receiptProcessingInformation).values({
            receiptId: created.id,
            processingStatus: options.status,
            startedAt: new Date(),
            endedAt: options.status !== 'processing' ? new Date() : null,
        });
    }

    // Add items if provided
    const items = [];
    if (options.items && options.items.length > 0) {
        for (let i = 0; i < options.items.length; i++) {
            const item = options.items[i];
            const [insertedItem] = await testDb
                .insert(receiptItem)
                .values({
                    receiptId: created.id,
                    interpretedText: item.interpretedText,
                    price: item.price.toString(),
                    quantity: (item.quantity ?? 1).toString(),
                    orderIndex: i,
                })
                .returning();
            items.push(insertedItem);
        }
    }

    return { receipt: created, items };
}

export async function createProcessingReceipt(userId: string) {
    return createTestReceipt(userId, {}, { status: 'processing' });
}

export async function createSuccessfulReceipt(
    userId: string,
    items: ReceiptItemInput[],
) {
    // Calculate totals from items
    const subtotal = items.reduce(
        (sum, item) => sum + item.price,
        0,
    );
    return createTestReceipt(
        userId,
        { subtotal: subtotal.toString(), grandTotal: subtotal.toString() },
        { items, status: 'success' },
    );
}

export async function createFailedReceipt(userId: string) {
    return createTestReceipt(userId, {}, { status: 'failed' });
}
