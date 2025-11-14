import { getAllReceiptInfo } from "./repository";
import { receiptEntityWithReferencesToDtoHelper, ReceiptDto } from "../dtos";
import { ReceiptNotFoundResponse, ReceiptProcessingFailedResponse, ReceiptProcessingResponse } from "../response-types";

export type GetReceiptResponse = ReceiptNotFoundResponse | ReceiptProcessingResponse | ReceiptProcessingFailedResponse | ReceiptDto;

export async function getReceiptWithItems(receiptId: string): Promise<GetReceiptResponse> {
    const receiptInformation = await getAllReceiptInfo(receiptId);
    if (!receiptInformation) {
        return { error: true, code: 'NOT_FOUND' }
    }
    if (receiptInformation?.processingInfo.some(x => x.processingStatus === 'processing')) {
        return { error: true, code: 'PROCESSING' }
    }

    const hasSuccesses = receiptInformation.processingInfo.some((receipt) => receipt.processingStatus === 'success');
    // have we failed, and dont have a success or a processing

    if (!hasSuccesses && receiptInformation.processingInfo.length > 0) {
        const failedAttemptsCount = receiptInformation.processingInfo.filter(
            (info) => info.processingStatus === "failed",
        ).length;

        if (failedAttemptsCount === receiptInformation.processingInfo.length) {
            return { error: true, code: "FAILED", attempts: failedAttemptsCount };
        }
    }

    return receiptEntityWithReferencesToDtoHelper(receiptInformation);
}

