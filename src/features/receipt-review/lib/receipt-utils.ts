import type { GetReceiptResponse } from '../server/responses';
import type { ReceiptDto } from '@/shared/dto/types';
import type {
  NotFoundResponse,
  ReceiptProcessingFailedResponse,
  ReceiptProcessingResponse,
} from '@/shared/server/response-types';

export function receiptNotFound(
  receipt: GetReceiptResponse,
): receipt is NotFoundResponse {
  return 'code' in receipt && receipt.code === 'NOT_FOUND';
}

export function isProcessing(
  receipt: GetReceiptResponse,
): receipt is ReceiptProcessingResponse {
  return 'code' in receipt && receipt.code === 'PROCESSING';
}

export function isFailed(
  receipt: GetReceiptResponse,
): receipt is ReceiptProcessingFailedResponse {
  return 'attempts' in receipt;
}

export function isComplete(receipt: GetReceiptResponse): receipt is ReceiptDto {
  return 'id' in receipt;
}
