import { computeReceiptValidity } from '../lib/receipt-validity';
import { receiptDtoSchema } from './dtos';
import type {
  PaymentMethod,
  ReceiptEntityWithItems,
  ReceiptItem,
} from '../server/db';
import type {
  FullRoomInfoDto,
  PaymentMethodDto,
  PaymentMethodPayToDto,
  ReceiptDto,
  ReceiptItemDto,
} from './types';
import type { GetFullRoomInfoResponseType } from '@/features/room/server/room-service';

// Helper Function
export const parseNullable = (v: string | null): number | null =>
  v === null ? null : parseFloat(v);

// Mappers
export const receiptItemEntityToDtoHelper = (
  item: ReceiptItem,
): ReceiptItemDto => {
  return {
    receiptItemId: item.id,
    rawText: item.rawText,
    interpretedText: item.interpretedText,
    price: parseFloat(item.price),
    quantity: parseFloat(item.quantity),
  };
};

export const receiptWithItemsToDto = (
  entity: ReceiptEntityWithItems,
): ReceiptDto => {
  const transformed = {
    receiptId: entity.id,
    title: entity.title,
    subtotal: parseNullable(entity.subtotal) ?? 0,
    tax: parseNullable(entity.tax) ?? 0,
    tip: parseNullable(entity.tip) ?? 0,
    grandTotal: parseNullable(entity.grandTotal) ?? 0,
    createdAt: entity.createdAt,
    items: entity.items.map(receiptItemEntityToDtoHelper),
  };
  // Validation happens here, keeping the schema active on server
  return receiptDtoSchema.parse(transformed);
};

export function mapDbRoomToDto(
  roomData: GetFullRoomInfoResponseType,
): FullRoomInfoDto | null {
  if (!roomData) return null;

  const receipt = receiptWithItemsToDto(roomData.receipt);

  const receiptValidResponse = computeReceiptValidity(receipt);

  return {
    roomId: roomData.id,
    status: roomData.status,
    title: roomData.title,
    receiptId: roomData.receiptId,
    createdAt: roomData.createdAt,
    updatedAt: roomData.updatedAt,
    createdBy: roomData.createdBy,
    members: roomData.members,
    claims: roomData.claims,
    receipt,
    receiptIsValid: receiptValidResponse.status === 'valid',
    hostPaymentInformation: roomData.hostPaymentMethod
      ? mapPaymentMethodToPayToDto(roomData.hostPaymentMethod)
      : null,
  };
}

export function mapPaymentMethodToDto(
  paymentMethod: PaymentMethod,
): PaymentMethodDto {
  const { id, ...rest } = paymentMethod;
  return {
    paymentMethodId: id,
    ...rest,
  };
}

export function mapPaymentMethodToPayToDto(
  paymentMethod: PaymentMethod,
): PaymentMethodPayToDto | null {
  return {
    type: paymentMethod.type,
    handle: paymentMethod.handle,
  };
}
