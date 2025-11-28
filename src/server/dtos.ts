import z from 'zod'
import {
    ReceiptEntityWithItems,
    ReceiptItemSelect,
    RoomSelect,
} from './db/schema'

export const receiptItemDtoSchema = z.object({
    id: z.string().uuid({ version: 'v4' }),
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

export const receiptTotalsSchema = z.object({
    id: z.string().uuid(),
    subtotal: z.number().nonnegative(),
    tax: z.number().nonnegative(),
    tip: z.number().nonnegative(),
    grandTotal: z.number().positive(),
})

export const receiptDtoSchema = z.object({
    id: z.string().uuid({ version: 'v4' }),
    title: z.string().nullable(),
    subtotal: z.number().nonnegative(),
    tax: z.number().nonnegative(),
    tip: z.number().nonnegative(),
    grandTotal: z.number().positive(),
    createdAt: z.date().nullable(),
    items: z.array(receiptItemDtoSchema),
})

export const roomMemberDtoSchema = z.object({
    id: z.string().uuid({ version: 'v4' }),
    displayName: z.string().nullable(),
    avatarUrl: z.string().url().nullable(),
    isGuest: z.boolean(),
})


export type ReceiptItemDto = z.infer<typeof receiptItemDtoSchema>
export type SaveReceiptItemDto = z.infer<typeof receiptItemWithReceiptIdSchema>
export type ReceiptDto = z.infer<typeof receiptDtoSchema>
export type ReceiptTotalsDto = z.infer<typeof receiptTotalsSchema>
export type RoomMemberDto = z.infer<typeof roomMemberDtoSchema>
export type NullableReceiptDto = ReceiptDto | null
export type NullableReceiptTotalsDto = ReceiptTotalsDto | null

// For FullRoomInfoDto, extend the DB type pragmatically
export type FullRoomInfoDto = RoomSelect & {
    receipt: ReceiptDto
    claims: any[]
    members: RoomMemberDto[]
}

export const receiptEntityWithReferencesToDtoHelper = (
    entity: ReceiptEntityWithItems | null,
): ReceiptDto | null => {
    if (!entity) return null
    const transformed = {
        id: entity.id,
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

export const receiptItemEntityToDtoHelper = (item: ReceiptItemSelect) => {
    return {
        id: item.id,
        rawText: item.rawText,
        interpretedText: item.interpretedText,
        price: parseFloat(item.price),
        quantity: parseFloat(item.quantity),
    }
}


