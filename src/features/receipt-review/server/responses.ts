import { NotFoundResponse } from '@/shared/server/response-types';
import { ReceiptWithRoom } from './get-receipt-service';

export type ReceiptProcessingResponse = { error: true; code: 'PROCESSING' };
export type ReceiptProcessingFailedResponse = {
  error: true;
  code: 'FAILED';
  attempts: number;
};
export type ReceiptSubtotalMismatchResponse = {
  error: true;
  code: 'SUBTOTAL_MISMATCH';
  clientSubtotal: number;
  serverSubtotal: number;
};
export type ReceiptGrandTotalMismatchResponse = {
  error: true;
  code: 'GRANDTOTAL_MISMATCH';
  clientGrandTotal: number;
  serverGrandTotal: number;
};
export const RECEIPT_PROCESSING: ReceiptProcessingResponse = {
  error: true,
  code: 'PROCESSING',
};
export const RECEIPT_PROCESSING_FAILED = (
  attempts: number,
): ReceiptProcessingFailedResponse => ({
  error: true,
  code: 'FAILED',
  attempts,
});

export type GetReceiptResponse =
  | NotFoundResponse
  | ReceiptProcessingResponse
  | ReceiptProcessingFailedResponse
  | ReceiptWithRoom;
