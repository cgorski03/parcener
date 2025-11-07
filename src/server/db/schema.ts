import { jsonb, numeric, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const receipt = pgTable('receipt', {
    id: uuid().primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }),
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }),
    tip: numeric('tip', { precision: 10, scale: 2 }),
    tax: numeric('tax', { precision: 10, scale: 2 }),
    grandTotal: numeric('grand_total', { precision: 10, scale: 2 }),
    rawResponse: jsonb('raw_parsing_response'),
    createdAt: timestamp('created_at').defaultNow(),
})

export const receiptItem = pgTable('receipt_item', {
    id: uuid('id').primaryKey().defaultRandom(),
    receiptId: uuid("receipt_id").notNull().references(() => receipt.id, { onDelete: "cascade" }),
    price: numeric('price', { precision: 10, scale: 2 }),
    rawText: varchar('raw_text', { length: 255 }),
    interpretedText: varchar('interpreted_text', { length: 1027 }),
    quantity: numeric('quantity', { precision: 5, scale: 2 }).default('1'),
})

export type ReceiptItemSelect = typeof receiptItem.$inferSelect;
export type ReceiptItemInsert = typeof receiptItem.$inferInsert;


