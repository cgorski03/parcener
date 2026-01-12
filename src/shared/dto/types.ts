import type z from 'zod';
import type * as schema from './dtos.ts';
import type { Claim } from '@/shared/server/db/schema';

export type ReceiptItemDto = z.infer<typeof schema.receiptItemDtoSchema>;
export type CreateReceiptItemDto = z.infer<
  typeof schema.createReceiptItemSchema
>;
export type SaveReceiptItemDto = z.infer<
  typeof schema.receiptItemWithReceiptIdSchema
>;
export type ReceiptDto = z.infer<typeof schema.receiptDtoSchema>;
export type ReceiptTotalsDto = z.infer<typeof schema.receiptTotalsSchema>;
export type RoomMemberDto = z.infer<typeof schema.baseRoomMemberSchema>;
export type RoomMembership = z.infer<typeof schema.roomMembershipSchema>;
export type RoomDto = z.infer<typeof schema.roomSchema>;
export type JoinRoomRequest = z.infer<typeof schema.joinRoomRequestSchema>;
export type NullableReceiptDto = ReceiptDto | null;
export type NullableReceiptTotalsDto = ReceiptTotalsDto | null;

// PaymentMethodType
export type CreatePaymentMethodRequest = z.infer<
  typeof schema.createPaymentMethodRequest
>;
export type PaymentMethodDto = z.infer<typeof schema.paymentMethodDtoSchema>;
export type PaymentMethodType = z.infer<typeof schema.paymentMethodTypeSchema>;
export type PaymentMethodPayToDto = z.infer<
  typeof schema.paymentMethodToPaySchema
>;

// Combined Types
export type FullRoomInfoDto = RoomDto & {
  receipt: ReceiptDto;
  claims: Array<Claim>;
  members: Array<RoomMemberDto>;
  receiptIsValid: boolean;
};
export type RecentRoomInfoDto = {
  joinedAt: string;
  room: RoomDto;
};
