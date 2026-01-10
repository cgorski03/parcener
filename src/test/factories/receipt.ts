import { eq } from 'drizzle-orm';
import type { DbType } from '@/shared/server/db';
import {
  receipt,
  receiptItem,
  receiptProcessingInformation,
} from '@/shared/server/db/schema';

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
    items?: Array<ReceiptItemInput>;
    status?: ProcessingStatus;
  } = {},
  db: DbType,
) {
  receiptCounter++;

  const [created] = await db
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
    await db.insert(receiptProcessingInformation).values({
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
      const [insertedItem] = await db
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

export async function createProcessingReceipt(
  userId: string,
  overrides: ReceiptOverrides = {},
  db: DbType,
) {
  return createTestReceipt(userId, overrides, { status: 'processing' }, db);
}

export async function createSuccessfulReceipt(
  userId: string,
  items: Array<ReceiptItemInput>,
  db: DbType,
) {
  // Calculate totals from items
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return createTestReceipt(
    userId,
    { subtotal: subtotal.toString(), grandTotal: subtotal.toString() },
    { items, status: 'success' },
    db,
  );
}

export async function createFailedReceipt(userId: string, db: DbType) {
  // Calculate totals from items
  return createTestReceipt(userId, {}, { status: 'failed' }, db);
}

/**
 * Add items to an existing receipt (useful for mocking in E2E tests)
 */
export async function addReceiptItems(
  db: DbType,
  receiptId: string,
  items: Array<ReceiptItemInput>,
) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    await db.insert(receiptItem).values({
      receiptId,
      interpretedText: item.interpretedText,
      price: item.price.toString(),
      quantity: (item.quantity ?? 1).toString(),
      orderIndex: i,
    });
  }
}

/**
 * Set processing information for a receipt (useful for mocking in E2E tests)
 * Updates existing record if it exists, otherwise inserts new one
 */
export async function setReceiptProcessingStatus(
  db: DbType,
  receiptId: string,
  status: ProcessingStatus,
) {
  // First, try to find existing processing record
  const existing = await db
    .select()
    .from(receiptProcessingInformation)
    .where(eq(receiptProcessingInformation.receiptId, receiptId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing record by its ID
    await db
      .update(receiptProcessingInformation)
      .set({
        processingStatus: status,
        endedAt: status !== 'processing' ? new Date() : null,
      })
      .where(eq(receiptProcessingInformation.id, existing[0].id));
  } else {
    // Insert new record
    await db.insert(receiptProcessingInformation).values({
      receiptId,
      processingStatus: status,
      startedAt: new Date(),
      endedAt: status !== 'processing' ? new Date() : null,
    });
  }
}

/**
 * Update receipt totals directly
 */
export async function updateReceiptTotals(
  db: DbType,
  receiptId: string,
  updates: {
    subtotal?: string;
    tip?: string;
    tax?: string;
    grandTotal?: string;
  },
) {
  await db.update(receipt).set(updates).where(eq(receipt.id, receiptId));
}
