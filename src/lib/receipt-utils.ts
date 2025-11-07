import { GetReceiptResponse, ReceiptDto } from "@/server/get-receipt/get-receipt-service";

export function isProcessing(receipt: GetReceiptResponse): receipt is { status: "processing" } {
    return receipt !== null && 'status' in receipt;
}

export function isFailed(receipt: GetReceiptResponse): receipt is { attempts: number } {
    return receipt !== null && 'attempts' in receipt;
}

export function isComplete(receipt: GetReceiptResponse): receipt is ReceiptDto {
    return receipt !== null && 'id' in receipt;
}
