import { z } from 'zod';
import { paymentMethodTypeEnum, type Claim } from '@/server/db/schema';

// ----- RECEIPT ITEM SCHEMA
export const receiptItemIdSchema = z.uuid({ version: 'v4' });


export const createReceiptItemDto = z.object({
    rawText: z.string().nullable(),
    interpretedText: z.string().min(1, 'Item name required'),
    price: z.number().nonnegative(),
    quantity: z.number().positive(),
})

export const receiptItemDtoSchema = createReceiptItemDto.extend({
    receiptItemId: receiptItemIdSchema,
})

export const receiptIdSchema = z.uuid({ version: 'v4' });

// For create operations where id can be null
export const receiptItemWithReceiptIdSchema = z.object({
    receiptId: receiptIdSchema,
    receiptItem: receiptItemDtoSchema
})

export const createReceiptItemRequestSchema = z.object({
    receiptId: receiptIdSchema,
    receiptItem: createReceiptItemDto,
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
    grandTotal: z.number().nonnegative(),
    createdAt: z.date().nullable(),
    items: z.array(receiptItemDtoSchema),
})

export const paymentMethodTypeSchema = z.enum(
    paymentMethodTypeEnum.enumValues
);

export const paymentMethodIdSchema = z.object({
    paymentMethodId: z.uuid({ version: 'v4' })
});

export const paymentMethodPayToDto = z.object({
    type: paymentMethodTypeSchema,
    handle: z.string().min(1).max(100),
})

export const createPaymentMethodRequest = paymentMethodPayToDto.extend({ isDefault: z.boolean() });
export const paymentMethodDto = createPaymentMethodRequest.extend(paymentMethodIdSchema.shape)

// ---------- ROOM SCHEMA
export const roomIdSchema = z.uuid({ version: 'v4' });
export const roomMemberIdSchema = z.uuid({ version: 'v4' });
export const userIdSchema = z.string().length(32);

export const roomObjSchema = z.object({
    roomId: roomIdSchema,
})

export const addRoomPaymentMethod = roomObjSchema.extend({
    paymentMethodId: z.uuidv4().nullable()
});

export const createRoomRequestSchema = z.object({
    receiptId: receiptIdSchema,
    paymentMethodId: z.uuidv4().nullable()
});

export const roomSchema = roomObjSchema.extend({
    receiptId: receiptIdSchema,
    title: z.union([z.string().max(255), z.null()]),
    createdBy: userIdSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
})

export const baseRoomMemberSchema = z.object({
    roomMemberId: roomMemberIdSchema,
    displayName: z.string().nullable(),
    avatarUrl: z.url().nullable(),
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
    roomId: z.uuid({ version: 'v4' }),
    since: z.date().optional().nullable(),
})

// Invites
export const inviteIdSearchParamsSchema = z.object({
    token: z.uuid({ version: 'v4' }),
})

// ------------- CLAIMS SCHEMA
export const claimItemRequestSchema = z.object({
    roomId: roomIdSchema,
    receiptItemId: receiptItemIdSchema,
    quantity: z.number().min(0),
});

// ------------- TYPES (Inferred)
export type ReceiptItemDto = z.infer<typeof receiptItemDtoSchema>
export type CreateReceiptItemDto = z.infer<typeof createReceiptItemDto>
export type SaveReceiptItemDto = z.infer<typeof receiptItemWithReceiptIdSchema>
export type ReceiptDto = z.infer<typeof receiptDtoSchema>
export type ReceiptTotalsDto = z.infer<typeof receiptTotalsSchema>
export type RoomMemberDto = z.infer<typeof baseRoomMemberSchema>
export type RoomMembership = z.infer<typeof roomMembershipSchema>
export type RoomDto = z.infer<typeof roomSchema>
export type JoinRoomRequest = z.infer<typeof joinRoomRequestSchema>
export type NullableReceiptDto = ReceiptDto | null
export type NullableReceiptTotalsDto = ReceiptTotalsDto | null


// PaymentMethodType
export type CreatePaymentMethodRequest = z.infer<typeof createPaymentMethodRequest>
export type PaymentMethodDto = z.infer<typeof paymentMethodDto>
export type PaymentMethodType = z.infer<typeof paymentMethodTypeSchema>
export type PaymentMethodPayToDto = z.infer<typeof paymentMethodPayToDto>

// Combined Types
export type FullRoomInfoDto = RoomDto & {
    receipt: ReceiptDto;
    claims: Claim[];
    members: RoomMemberDto[];
    receiptIsValid: boolean;
    hostPaymentInformation: PaymentMethodPayToDto | null;
}
export type RecentRoomInfoDto = {
    joinedAt: string;
    room: RoomDto;
}
