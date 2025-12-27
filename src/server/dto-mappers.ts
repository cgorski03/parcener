import {
    type ReceiptDto,
    receiptDtoSchema,
    type FullRoomInfoDto,
    type ReceiptItemDto,
    PaymentMethodDto
} from './dtos';
import {
    PaymentMethod,
    type ReceiptEntityWithItems,
    type ReceiptItem
} from './db/schema';
import { validateReceiptCalculations } from './money-math';

// Helper Function
export const parseNullable = (v: string | null): number | null =>
    v === null ? null : parseFloat(v)

// Mappers
export const receiptItemEntityToDtoHelper = (item: ReceiptItem): ReceiptItemDto => {
    return {
        receiptItemId: item.id,
        rawText: item.rawText,
        interpretedText: item.interpretedText,
        price: parseFloat(item.price),
        quantity: parseFloat(item.quantity),
    }
}

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
    }
    // Validation happens here, keeping the schema active on server
    return receiptDtoSchema.parse(transformed)
}

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
    };
}

export function mapPaymentMethodToDto(paymentMethod: PaymentMethod): PaymentMethodDto {
    const { id, ...rest } = paymentMethod;
    return {
        paymentMethodId: id,
        ...rest
    }
}
