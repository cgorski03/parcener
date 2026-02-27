import type { ReceiptImageObject } from './get-receipt-service';

export type { ReceiptImageObject } from './get-receipt-service';

export type ReceiptImageAccessResult =
  | { type: 'ok'; image: ReceiptImageObject }
  | { type: 'forbidden' }
  | { type: 'not_found' };
