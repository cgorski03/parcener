import { relations } from "drizzle-orm";
import { integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const receiptProcessingEnum = pgEnum('processing_status', ['processing', 'failed', 'success']);

export const receipt = pgTable('receipt', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }),
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull().default('0'),
    tip: numeric('tip', { precision: 10, scale: 2 }).notNull().default('0'),
    tax: numeric('tax', { precision: 10, scale: 2 }).notNull().default('0'),
    grandTotal: numeric('grand_total', { precision: 10, scale: 2 }).notNull().default('0'),
    rawResponse: jsonb('raw_parsing_response'),
    createdAt: timestamp('created_at').defaultNow(),
})
export const receiptProcessingInformation = pgTable('receipt_processing_information', {
    id: uuid('id').primaryKey().defaultRandom(),
    receiptId: uuid("receipt_id").notNull().references(() => receipt.id, { onDelete: "cascade" }),
    processingStatus: receiptProcessingEnum('processing_status').notNull(),
    startedAt: timestamp('started_at').defaultNow(),
    endedAt: timestamp('ended_at').defaultNow(),
    // Information for error if exists
    errorMessage: text('error_message'),
    errorDetails: jsonb('error_details'),
    model: varchar('model', { length: 30 }),
    processingTokens: integer('processing_tokens'),
})

export const receiptItem = pgTable('receipt_item', {
    id: uuid('id').primaryKey().defaultRandom(),
    receiptId: uuid("receipt_id").notNull().references(() => receipt.id, { onDelete: "cascade" }),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    rawText: varchar('raw_text', { length: 255 }),
    interpretedText: varchar('interpreted_text', { length: 1027 }).notNull(),
    quantity: numeric('quantity', { precision: 5, scale: 2 }).default('1').notNull(),
})

export const receiptRelations = relations((receipt), ({ many }) => ({
    items: many(receiptItem),
    processingInfo: many(receiptProcessingInformation),
}))

export const receiptItemRelations = relations(receiptItem, ({ one }) => ({
    receipt: one(receipt, {
        fields: [receiptItem.receiptId],
        references: [receipt.id]
    }),
}))

export const receiptProcessingRelations = relations(receiptProcessingInformation, ({ one }) => ({
    receipt: one(receipt, {
        fields: [receiptProcessingInformation.receiptId],
        references: [receipt.id]
    }),
}))

export type ReceiptItemSelect = typeof receiptItem.$inferSelect;
export type ReceiptItemInsert = typeof receiptItem.$inferInsert;

export type ReceiptSelect = typeof receipt.$inferSelect;
export type ReceiptInsert = typeof receipt.$inferInsert;


