export type ReceiptNotFoundResponse = { error: true; code: 'NOT_FOUND' };
export type ReceiptProcessingResponse = { error: true; code: 'PROCESSING' };
export type ReceiptProcessingFailedResponse = { error: true; code: 'FAILED', attempts: number };
export type ReceiptSubtotalMismatchResponse = { error: true; code: 'SUBTOTAL_MISMATCH'; clientSubtotal: number; serverSubtotal: number };
export type ReceiptGrandTotalMismatchResponse = { error: true; code: 'GRANDTOTAL_MISMATCH'; clientGrandTotal: number; serverGrandTotal: number };

export type RoomCreateError = { error: true; code: 'ROOM_NOT_CREATED' };

export const RECEIPT_NOT_FOUND: ReceiptNotFoundResponse = { error: true, code: 'NOT_FOUND' };
export const RECEIPT_PROCESSING: ReceiptProcessingResponse = { error: true, code: 'PROCESSING' };
export const RECEIPT_PROCESSING_FAILED = (attempts: number): ReceiptProcessingFailedResponse => ({ error: true, code: 'FAILED', attempts });

export const ROOM_CREATE_ERROR: RoomCreateError = { error: true, code: 'ROOM_NOT_CREATED' };
