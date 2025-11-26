import { relations } from 'drizzle-orm'
import {
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { user } from './auth-schema'
import { unique } from 'drizzle-orm/pg-core'

export const receiptProcessingEnum = pgEnum('processing_status', [
  'processing',
  'failed',
  'success',
])

export const receipt = pgTable('receipt', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),
  tip: numeric('tip', { precision: 10, scale: 2 }).notNull().default('0'),
  tax: numeric('tax', { precision: 10, scale: 2 }).notNull().default('0'),
  grandTotal: numeric('grand_total', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),
  rawResponse: jsonb('raw_parsing_response'),
  createdAt: timestamp('created_at').defaultNow(),
})
export type ReceiptSelect = typeof receipt.$inferSelect
export type ReceiptInsert = typeof receipt.$inferInsert

export const receiptProcessingInformation = pgTable(
  'receipt_processing_information',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    receiptId: uuid('receipt_id')
      .notNull()
      .references(() => receipt.id, { onDelete: 'cascade' }),
    processingStatus: receiptProcessingEnum('processing_status').notNull(),
    startedAt: timestamp('started_at').defaultNow(),
    endedAt: timestamp('ended_at').defaultNow(),
    // Information for error if exists
    errorMessage: text('error_message'),
    errorDetails: jsonb('error_details'),
    model: varchar('model', { length: 30 }),
    processingTokens: integer('processing_tokens'),
  },
)

export const receiptItem = pgTable('receipt_item', {
  id: uuid('id').primaryKey().defaultRandom(),
  receiptId: uuid('receipt_id')
    .notNull()
    .references(() => receipt.id, { onDelete: 'cascade' }),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  rawText: varchar('raw_text', { length: 255 }),
  interpretedText: varchar('interpreted_text', { length: 1027 }).notNull(),
  quantity: numeric('quantity', { precision: 5, scale: 2 })
    .default('1')
    .notNull(),
})
export type ReceiptItemSelect = typeof receiptItem.$inferSelect
export type ReceiptItemInsert = typeof receiptItem.$inferInsert

export const receiptRelations = relations(receipt, ({ many }) => ({
  items: many(receiptItem),
  processingInfo: many(receiptProcessingInformation),
}))

export type ReceiptEntityWithItems = ReceiptSelect & {
  items: ReceiptItemSelect[]
}

export const receiptItemRelations = relations(receiptItem, ({ one, many }) => ({
  receipt: one(receipt, {
    fields: [receiptItem.receiptId],
    references: [receipt.id],
  }),
  claims: many(claim),
}))

export const receiptProcessingRelations = relations(
  receiptProcessingInformation,
  ({ one }) => ({
    receipt: one(receipt, {
      fields: [receiptProcessingInformation.receiptId],
      references: [receipt.id],
    }),
  }),
)

export const room = pgTable('room', {
  id: uuid('id').primaryKey().defaultRandom(),
  receiptId: uuid('receipt_id')
    .notNull()
    .references(() => receipt.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }),
  createdBy: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
export type RoomSelect = typeof room.$inferSelect

export const roomRelations = relations(room, ({ one, many }) => ({
  receipt: one(receipt, { fields: [room.receiptId], references: [receipt.id] }),
  members: many(roomMember),
  claims: many(claim),
}))

export const roomMember = pgTable('room_member', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id')
    .notNull()
    .references(() => room.id, { onDelete: 'cascade' }),
  // either a real user or a guestSession
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  guestUuid: uuid('guest_uuid'),
  displayName: varchar('display_name', { length: 100 }),
  joinedAt: timestamp('joined_at').defaultNow(),
})

export type RoomMemberSelect = typeof roomMember.$inferSelect

export const roomMemberRelations = relations(roomMember, ({ one, many }) => ({
  room: one(room, { fields: [roomMember.roomId], references: [room.id] }),
  user: one(user, { fields: [roomMember.userId], references: [user.id] }),
  claims: many(claim),
}))

export const claim = pgTable(
  'claim',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roomId: uuid('room_id')
      .notNull()
      .references(() => room.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => roomMember.id, { onDelete: 'cascade' }),
    receiptItemId: uuid('receipt_item_id')
      .notNull()
      .references(() => receiptItem.id, { onDelete: 'cascade' }),
    quantity: numeric('quantity', { precision: 10, scale: 2 })
      .notNull()
      .default('1'),
    claimedAt: timestamp('claimed_at').defaultNow(),
  },
  (table) => ({
    uniqueClaim: unique().on(table.roomId, table.memberId, table.receiptItemId),
  }),
)

export type ClaimSelect = typeof claim.$inferSelect
export const claimRelations = relations(claim, ({ one }) => ({
  room: one(room, { fields: [claim.roomId], references: [room.id] }),
  roomMember: one(roomMember, {
    fields: [claim.memberId],
    references: [roomMember.id],
  }),
  receiptItem: one(receiptItem, {
    fields: [claim.receiptItemId],
    references: [receiptItem.id],
  }),
}))
