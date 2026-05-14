import { relations } from 'drizzle-orm';
import {
  boolean,
  foreignKey,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

export const receiptProcessingEnum = pgEnum('processing_status', [
  'processing',
  'failed',
  'success',
]);

export const receiptValidityState = pgEnum('validity_state', [
  'valid',
  'grandtotal_mismatch',
  'subtotal_mismatch',
]);

export const feeAllocationMethod = pgEnum('allocation_type', [
  'even',
  'proportional',
  'host_only',
]);

export const taxAllocationModeEnum = pgEnum('tax_allocation_mode', [
  'receipt_level',
  'itemized',
]);

export const itemizedTaxStatusEnum = pgEnum('itemized_tax_status', [
  'taxable',
  'exempt',
  'unknown',
]);

export const taxClassificationSourceEnum = pgEnum('tax_classification_source', [
  'model',
  'user',
]);

export const roomStatusEnum = pgEnum('room_status', ['active', 'locked']);
export const receiptStateEnum = pgEnum('receipt_state', ['active', 'locked']);
export const paymentMethodTypeEnum = pgEnum('payment_method_type', ['venmo']);

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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  taxAllocationMode: taxAllocationModeEnum('tax_allocation_mode')
    .notNull()
    .default('receipt_level'),
});

export const taxCode = pgTable(
  'receipt_tax_code',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    receiptId: uuid('receipt_id')
      .notNull()
      .references(() => receipt.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 16 }).notNull(),
    label: varchar('label', { length: 127 }),
    rateBps: integer('rate_bps'),
    orderIndex: integer('order_index').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    source: taxClassificationSourceEnum('tax_code_source')
      .default('model')
      .notNull(),
  },
  (table) => [
    unique('receipt_tax_code_receipt_id_id_unique').on(
      table.receiptId,
      table.id,
    ),
    unique('receipt_tax_code_receipt_id_code_unique').on(
      table.receiptId,
      table.code,
    ),
  ],
);

export const receiptFees = pgTable(
  'receipt_fee',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    receiptId: uuid('receipt_id')
      .notNull()
      .references(() => receipt.id, { onDelete: 'cascade' }),
    taxCodeId: uuid('tax_code_id'),
    rawText: varchar('raw_text', { length: 255 }),
    allocationMethod: feeAllocationMethod('allocation_method')
      .notNull()
      .default('proportional'),
    label: varchar('label', { length: 127 }).notNull(),
    taxable: boolean().notNull().default(false),
    amount: numeric('amount', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    orderIndex: integer('order_index').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.receiptId, table.taxCodeId],
      foreignColumns: [taxCode.receiptId, taxCode.id],
      name: 'receipt_fee_tax_code_same_receipt_fk',
    }),
  ],
);

export const receiptProcessingInformation = pgTable(
  'receipt_processing_information',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    receiptId: uuid('receipt_id')
      .notNull()
      .references(() => receipt.id, { onDelete: 'cascade' }),
    processingStatus: receiptProcessingEnum('processing_status').notNull(),
    initialValidityStatus: receiptValidityState('initial_validity_status'),
    startedAt: timestamp('started_at').defaultNow(),
    endedAt: timestamp('ended_at').defaultNow(),
    // Information for error if exists
    errorMessage: text('error_message'),
    errorDetails: jsonb('error_details'),
    rawResponse: text('raw_parsing_response'),
    model: varchar('model', { length: 30 }),
    processingTokens: integer('processing_tokens'),
    thinkingLevel: text('thinking_level'),
  },
);

export const receiptItem = pgTable(
  'receipt_item',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    receiptId: uuid('receipt_id')
      .notNull()
      .references(() => receipt.id, { onDelete: 'cascade' }),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    rawText: varchar('raw_text', { length: 255 }),
    interpretedText: varchar('interpreted_text', { length: 1027 }).notNull(),
    orderIndex: integer('order_index').notNull().default(0),
    quantity: numeric('quantity', { precision: 5, scale: 2 })
      .default('1')
      .notNull(),
  },
  (table) => [
    unique('receipt_item_receipt_id_id_unique').on(table.receiptId, table.id),
  ],
);

export const receiptItemTaxClassification = pgTable(
  'receipt_item_tax_classification',
  {
    receiptItemId: uuid('receipt_item_id').primaryKey(),
    receiptId: uuid('receipt_id')
      .notNull()
      .references(() => receipt.id, { onDelete: 'cascade' }),
    taxCodeId: uuid('tax_code_id'),
    status: itemizedTaxStatusEnum('status').notNull().default('unknown'),
    source: taxClassificationSourceEnum('source').notNull().default('model'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.receiptId, table.receiptItemId],
      foreignColumns: [receiptItem.receiptId, receiptItem.id],
      name: 'receipt_item_tax_classification_item_same_receipt_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.receiptId, table.taxCodeId],
      foreignColumns: [taxCode.receiptId, taxCode.id],
      name: 'receipt_item_tax_classification_tax_code_same_receipt_fk',
    }),
  ],
);

export const room = pgTable('room', {
  id: uuid('id').primaryKey().defaultRandom(),
  receiptId: uuid('receipt_id')
    .notNull()
    .unique()
    .references(() => receipt.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }),
  createdBy: text('created_by')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  hostPaymentMethodId: uuid('host_payment_method_id').references(
    () => paymentMethod.id,
    { onDelete: 'set null' },
  ),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  status: roomStatusEnum('room_status').default('active').notNull(),
  lockedAt: timestamp('locked_at'),
});

export const roomMember = pgTable('room_member', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id')
    .notNull()
    .references(() => room.id, { onDelete: 'cascade' }),
  // either a real user or a guestSession
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  guestUuid: uuid('guest_uuid'),
  displayName: varchar('display_name', { length: 63 }),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

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
  (table) => [unique().on(table.roomId, table.memberId, table.receiptItemId)],
);

export const invite = pgTable('invite', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdBy: text('created_by')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  usedBy: text('used_by').references(() => user.id, { onDelete: 'cascade' }),
  usedAt: timestamp('used_at'),
});

export const paymentMethod = pgTable('payment_method', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  type: paymentMethodTypeEnum('type').notNull(),
  handle: text('handle').notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ---------- Relations
export const receiptRelations = relations(receipt, ({ one, many }) => ({
  items: many(receiptItem),
  taxCodes: many(taxCode),
  fees: many(receiptFees),
  processingInfo: many(receiptProcessingInformation),
  room: one(room),
}));

export const roomMemberRelations = relations(roomMember, ({ one, many }) => ({
  room: one(room, { fields: [roomMember.roomId], references: [room.id] }),
  user: one(user, { fields: [roomMember.userId], references: [user.id] }),
  claims: many(claim),
}));

export const roomRelations = relations(room, ({ one, many }) => ({
  receipt: one(receipt, { fields: [room.receiptId], references: [receipt.id] }),
  members: many(roomMember),
  claims: many(claim),
  hostPaymentMethod: one(paymentMethod, {
    fields: [room.hostPaymentMethodId],
    references: [paymentMethod.id],
  }),
}));

export const receiptItemRelations = relations(receiptItem, ({ one, many }) => ({
  receipt: one(receipt, {
    fields: [receiptItem.receiptId],
    references: [receipt.id],
  }),
  taxClassification: one(receiptItemTaxClassification),
  claims: many(claim),
}));

export const receiptItemTaxClassificationRelations = relations(
  receiptItemTaxClassification,
  ({ one }) => ({
    receipt: one(receipt, {
      fields: [receiptItemTaxClassification.receiptId],
      references: [receipt.id],
    }),
    receiptItem: one(receiptItem, {
      fields: [receiptItemTaxClassification.receiptItemId],
      references: [receiptItem.id],
    }),
    taxCode: one(taxCode, {
      fields: [receiptItemTaxClassification.taxCodeId],
      references: [taxCode.id],
    }),
  }),
);

export const taxCodeRelations = relations(taxCode, ({ one, many }) => ({
  receipt: one(receipt, {
    fields: [taxCode.receiptId],
    references: [receipt.id],
  }),
  itemClassifications: many(receiptItemTaxClassification),
  fees: many(receiptFees),
}));

export const receiptFeesRelations = relations(receiptFees, ({ one }) => ({
  receipt: one(receipt, {
    fields: [receiptFees.receiptId],
    references: [receipt.id],
  }),
  taxCode: one(taxCode, {
    fields: [receiptFees.taxCodeId],
    references: [taxCode.id],
  }),
}));

export const receiptProcessingRelations = relations(
  receiptProcessingInformation,
  ({ one }) => ({
    receipt: one(receipt, {
      fields: [receiptProcessingInformation.receiptId],
      references: [receipt.id],
    }),
  }),
);

export const paymentMethodRelations = relations(
  paymentMethod,
  ({ one, many }) => ({
    user: one(user, {
      fields: [paymentMethod.userId],
      references: [user.id],
    }),
    linkedRooms: many(room),
  }),
);

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
}));

export const inviteRelations = relations(invite, ({ one }) => ({
  creator: one(user, {
    fields: [invite.createdBy],
    references: [user.id],
    relationName: 'invitesCreated',
  }),
  redeemer: one(user, {
    fields: [invite.usedBy],
    references: [user.id],
    relationName: 'invitesRedeemed',
  }),
}));

// ---------- Types
//
export type Receipt = typeof receipt.$inferSelect;
export type NewReceipt = typeof receipt.$inferInsert;

export type Claim = typeof claim.$inferSelect;
export type RoomMember = typeof roomMember.$inferSelect;
export type Room = typeof room.$inferSelect;

export type ReceiptItem = typeof receiptItem.$inferSelect;
export type NewReceiptItem = typeof receiptItem.$inferInsert;
export type ReceiptItemTaxClassification =
  typeof receiptItemTaxClassification.$inferSelect;
export type NewReceiptItemTaxClassification =
  typeof receiptItemTaxClassification.$inferInsert;
export type TaxCode = typeof taxCode.$inferSelect;
export type NewTaxCode = typeof taxCode.$inferInsert;
export type ReceiptFee = typeof receiptFees.$inferSelect;
export type NewReceiptFee = typeof receiptFees.$inferInsert;

export type AppUser = typeof user.$inferInsert;

export type PaymentMethod = typeof paymentMethod.$inferSelect;
export type NewPaymentMethod = typeof paymentMethod.$inferInsert;

export type Invite = typeof invite.$inferSelect;
export type ReceiptEntityWithItems = Receipt & {
  items: Array<ReceiptItem>;
  fees: Array<ReceiptFee>;
};

export type RoomStatus = typeof roomStatusEnum;

export type ReceiptProcessingState =
  (typeof receiptProcessingEnum.enumValues)[number];
export type ReceiptValidityState =
  (typeof receiptValidityState.enumValues)[number];
export type TaxAllocationMode =
  (typeof taxAllocationModeEnum.enumValues)[number];
export type ItemizedTaxStatus =
  (typeof itemizedTaxStatusEnum.enumValues)[number];
export type TaxClassificationSource =
  (typeof taxClassificationSourceEnum.enumValues)[number];
