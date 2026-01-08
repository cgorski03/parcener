import { validateReceiptCalculations } from '../lib/money-math';
import {
  PaymentMethod,
  ReceiptEntityWithItems,
  ReceiptItem,
} from '../server/db';
import { receiptDtoSchema } from './dtos';
import type {
  FullRoomInfoDto,
  PaymentMethodDto,
  PaymentMethodPayToDto,
  ReceiptDto,
  ReceiptItemDto,
} from './types';

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

export function mapDbRoomToDto(roomData: any): FullRoomInfoDto | null {
  if (!roomData) return null;

  const receipt = receiptWithItemsToDto(roomData.receipt);
  // Since we are inside the mapper logic, logic flow checks are fine
  if (!receipt) return null;

  const receiptValidResponse = validateReceiptCalculations(receipt);

  return {
    roomId: roomData.id,
    title: roomData.title,
    receiptId: roomData.receiptId,
    createdAt: roomData.createdAt,
    updatedAt: roomData.updatedAt,
    createdBy: roomData.createdBy,
    members: roomData.members,
    claims: roomData.claims,
    receipt,
    receiptIsValid: receiptValidResponse.isValid,
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
  if (!paymentMethod) return null;
  return {
    type: paymentMethod.type,
    handle: paymentMethod.handle,
  };
}
