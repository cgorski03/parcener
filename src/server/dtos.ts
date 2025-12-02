import z from 'zod'
import {
    ReceiptEntityWithItems,
    ReceiptItem,
} from './db/schema'

// ----- RECEIPT ITEM SCHEMA
export const receiptItemIdSchema = z.string().uuid({ version: 'v4' });
export const receiptItemDtoSchema = z.object({
    receiptItemId: receiptItemIdSchema,
    rawText: z.string().nullable(),
    interpretedText: z.string().min(1, 'Item name required'),
    price: z.number().positive(),
    quantity: z.number().positive(),
})

export const receiptIdSchema = z.string().uuid({ version: 'v4' });

// For create operations where id can be null
export const receiptItemWithReceiptIdSchema = z.object({
    receiptId: receiptIdSchema,
    receiptItem: receiptItemDtoSchema
})

// ----- RECEIPT SCHEMA
export const receiptTotalsSchema = z.object({
    receiptId: receiptIdSchema,
    subtotal: z.number().nonnegative(),
    tax: z.number().nonnegative(),
    tip: z.number().nonnegative(),
    grandTotal: z.number().positive(),
})

export const receiptDtoSchema = z.object({
    receiptId: receiptIdSchema,
    title: z.string().nullable(),
    subtotal: z.number().nonnegative(),
    tax: z.number().nonnegative(),
    tip: z.number().nonnegative(),
    grandTotal: z.number().positive(),
    createdAt: z.date().nullable(),
    items: z.array(receiptItemDtoSchema),
})

// ---------- ROOM SCHEMA
export const roomIdSchema = z.string().uuid({ version: 'v4' });
export const roomMemberIdSchema = z.string().uuid({ version: 'v4' });
export const userIdSchema = z.string().uuid({ version: 'v4' });

export const roomSchema = z.object({
    roomId: roomIdSchema,
    receiptId: receiptIdSchema,
    title: z.union([z.string().max(255), z.null()]),
    createdBy: userIdSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
})

export const baseRoomMemberSchema = z.object({
    roomMemberId: roomMemberIdSchema,
    displayName: z.string().nullable(),
    avatarUrl: z.string().url().nullable(),
    isGuest: z.boolean().nullable(),
})

export const roomMembershipSchema = z.object({
    roomMemberId: roomMemberIdSchema,
    displayName: z.string().nullable(),
    userId: z.union([userIdSchema, z.null()]),
    guestUuid: z.union([userIdSchema, z.null()]),
    joinedAt: z.date(),
})

export const joinRoomRequestSchema = z.object({
    roomId: roomIdSchema,
    displayName: z.union([z.string().max(63), z.null()]),
});

export const updateDisplayNameRoomRequestSchema = z.object({
    roomId: roomIdSchema,
    displayName: z.string().max(63),
});
export const getRoomPulseSchema = z.object({
    roomId: z.string().uuid(),
    since: z.date().optional().nullable(),
})


// Invites
export const inviteIdSearchParamsSchema = z.object({
    token: z.string().uuid({ version: 'v4' }),
})

// ------------- CLAIMS SCHEMA
export const claimItemRequestSchema = z.object({
    roomId: roomIdSchema,
    receiptItemId: receiptItemIdSchema,
    quantity: z.number().min(0),
});


export type ReceiptItemDto = z.infer<typeof receiptItemDtoSchema>
export type SaveReceiptItemDto = z.infer<typeof receiptItemWithReceiptIdSchema>
export type ReceiptDto = z.infer<typeof receiptDtoSchema>
export type ReceiptTotalsDto = z.infer<typeof receiptTotalsSchema>
export type RoomMemberDto = z.infer<typeof baseRoomMemberSchema>
export type RoomMembership = z.infer<typeof roomMembershipSchema>
export type RoomDto = z.infer<typeof roomSchema>
export type NullableReceiptDto = ReceiptDto | null
export type NullableReceiptTotalsDto = ReceiptTotalsDto | null
//
// For FullRoomInfoDto, extend the DB type pragmatically
export type FullRoomInfoDto = RoomDto & {
    receipt: ReceiptDto
    claims: any[]
    members: RoomMemberDto[]
}

export const receiptEntityWithReferencesToDtoHelper = (
    entity: ReceiptEntityWithItems | null,
): ReceiptDto | null => {
    if (!entity) return null
    const transformed = {
        receiptId: entity.id,
        title: entity.title,
        subtotal: parseNullable(entity.subtotal) ?? 0,
        tax: parseNullable(entity.tax) ?? 0,
        tip: parseNullable(entity.tip) ?? 0,
        grandTotal: parseNullable(entity.grandTotal) ?? 0,
        createdAt: entity.createdAt,
        items: entity.items.map(receiptItemEntityToDtoHelper),
    }

    return receiptDtoSchema.parse(transformed)
}

export const parseNullable = (v: string | null): number | null =>
    v === null ? null : parseFloat(v)

export const receiptItemEntityToDtoHelper = (item: ReceiptItem) => {
    return {
        receiptItemId: item.id,
        rawText: item.rawText,
        interpretedText: item.interpretedText,
        price: parseFloat(item.price),
        quantity: parseFloat(item.quantity),
    }
}

