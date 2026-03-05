import { useSuspenseQuery } from '@tanstack/react-query';
import { receiptReviewOptions } from './use-get-receipt';
import type { ReceiptWithRoom } from '../server/get-receipt-service';

export function useReadyReceipt(
  receiptId: string,
  initialReceipt?: ReceiptWithRoom,
) {
  const { data, ...rest } = useSuspenseQuery({
    ...receiptReviewOptions(receiptId),
    initialData: initialReceipt,
  });

  if (!('items' in data)) {
    throw new Error('Receipt not available');
  }

  return { data, items: data.items, ...rest };
}
