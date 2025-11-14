export type ReceiptNotFoundResponse = { error: true; code: 'NOT_FOUND' };
export type ReceiptProcessingResponse = { error: true; code: 'PROCESSING' };
export type ReceiptProcessingFailedResponse = { error: true; code: 'FAILED', attempts: number };
