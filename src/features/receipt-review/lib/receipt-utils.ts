import type {
  GetReceiptResponse,
  NotFoundResponse,
  ReceiptProcessingFailedResponse,
  ReceiptProcessingResponse,
} from '../server/responses';

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
