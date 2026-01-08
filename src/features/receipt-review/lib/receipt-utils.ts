import type { ReceiptDto } from '@/shared/dto/types';
import type {
  NotFoundResponse,
  ReceiptProcessingFailedResponse,
  ReceiptProcessingResponse,
} from '@/shared/server/response-types';
import { GetReceiptResponse } from '../server/responses';

export function receiptNotFound(
  receipt: GetReceiptResponse,
): receipt is NotFoundResponse {
  return receipt !== null && 'code' in receipt && receipt.code === 'NOT_FOUND';
}

export function isProcessing(
  receipt: GetReceiptResponse,
): receipt is ReceiptProcessingResponse {
  return receipt !== null && 'code' in receipt && receipt.code === 'PROCESSING';
}

export function isFailed(
  receipt: GetReceiptResponse,
): receipt is ReceiptProcessingFailedResponse {
  return receipt !== null && 'attempts' in receipt;
}

export function isComplete(receipt: GetReceiptResponse): receipt is ReceiptDto {
  return receipt !== null && 'id' in receipt;
}
