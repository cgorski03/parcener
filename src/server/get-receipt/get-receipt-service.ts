import { getAllReceiptInfo } from "./repository";

type processingStatus = { status: 'processing' }
type failedStatus = { attempts: number }
export type ReceiptItemDto = {
    id: string;
    rawText: string;
    interpretedText: string;
    price: string;
    quantity: string;
}
export type ReceiptDto = {
    id: string;
    title: string | null;
    subtotal: string | null;
    tax: string | null;
    tip: string | null;
    grandTotal: string | null;
    createdAt: Date | null;
    items: ReceiptItemDto[]

} | null
const generateReceiptDtoFromDbReceipt = (receipt: Awaited<ReturnType<typeof getAllReceiptInfo>>): ReceiptDto => {
    if (!receipt) return null;
    return {
        id: receipt.id,
        title: receipt.title,
        subtotal: receipt.subtotal,
        tax: receipt.tax,
        tip: receipt.tip,
        grandTotal: receipt.grandTotal,
        // dealing with why this is ever null later 
        createdAt: receipt.createdAt,
        items: receipt.items.map((item) => ({
            id: item.id,
            rawText: item.rawText,
            interpretedText: item.interpretedText,
            price: item.price,
            quantity: item.quantity
        })),
    }
}

export type GetReceiptResponse = processingStatus | failedStatus | ReceiptDto;
export async function getReceiptWithItems(receiptId: string): Promise<GetReceiptResponse> {
    const receiptInformation = await getAllReceiptInfo(receiptId);
    if (receiptInformation?.processingInfo.some(x => x.processingStatus === 'success')) {
        return generateReceiptDtoFromDbReceipt(receiptInformation);
    }
    if (receiptInformation?.processingInfo.some(x => x.processingStatus === 'processing')) {
        return { status: 'processing' }
    }
    return { attempts: receiptInformation?.processingInfo.filter((info) => info.processingStatus === 'failed').length ?? 0 }
}

