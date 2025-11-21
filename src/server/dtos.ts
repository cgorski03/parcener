import { ReceiptEntityWithItems, ReceiptItemSelect } from "./db/schema";
import { getAllReceiptInfo } from "./get-receipt/repository";

export type ReceiptItemDto = {
    id: string;
    // If the item is custom from the user, this will be null
    rawText: string | null;
    interpretedText: string;
    price: number;
    quantity: number;
}

export type SaveReceiptItemDto = Omit<ReceiptItemDto, 'id'> & {
    id: string | null;
};

export type ReceiptDto = {
    id: string;
    title: string | null;
    subtotal: number;
    tax: number;
    tip: number;
    grandTotal: number;
    createdAt: Date | null;
    items: ReceiptItemDto[]

} | null;

export type ReceiptTotalsDto = {
    id: string;
    subtotal: number;
    tax: number;
    tip: number;
    grandTotal: number;
} | null;

export const receiptEntityWithReferencesToDtoHelper = (
    receipt: ReceiptEntityWithItems,
): ReceiptDto => {
    if (!receipt) return null
    return {
        id: receipt.id,
        title: receipt.title,
        subtotal: parseNullable(receipt.subtotal) ?? 0,
        tax: parseNullable(receipt.tax) ?? 0,
        tip: parseNullable(receipt.tip) ?? 0,
        grandTotal: parseNullable(receipt.grandTotal) ?? 0,
        createdAt: receipt.createdAt,
        items: receipt.items.map((item) => (receiptItemEntityToDtoHelper(item))),
    }
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

export type RoomMemberDto = {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    isGuest: boolean;
}
