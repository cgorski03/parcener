import { useGetReceiptReview } from './use-get-receipt';
import type { ReceiptWithRoom } from '../server/get-receipt-service';

export function useReadyReceipt(
  receiptId: string,
  initialReceipt?: ReceiptWithRoom,
) {
  const query = useGetReceiptReview(receiptId, {
    initialData: initialReceipt,
  });
  const { data, ...rest } = query;

  if (!data || !('items' in data)) {
    throw new Error('Receipt not available');
  }

  return { data, items: data.items, ...rest };
}
