import { ReceiptDto } from "@/server/dtos";
import { GetReceiptResponse } from "@/server/get-receipt/get-receipt-service";
import { ReceiptNotFoundResponse, ReceiptProcessingFailedResponse, ReceiptProcessingResponse } from "@/server/response-types";

export function receiptNotFound(receipt: GetReceiptResponse): receipt is ReceiptNotFoundResponse {
    return receipt !== null && 'code' in receipt && receipt.code === 'NOT_FOUND';
}

export function isProcessing(receipt: GetReceiptResponse): receipt is ReceiptProcessingResponse {
    return receipt !== null && 'code' in receipt && receipt.code === 'PROCESSING';
}

export function isFailed(receipt: GetReceiptResponse): receipt is ReceiptProcessingFailedResponse {
    return receipt !== null && 'attempts' in receipt;
}

export function isComplete(receipt: GetReceiptResponse): receipt is ReceiptDto {
    return receipt !== null && 'id' in receipt;
}
