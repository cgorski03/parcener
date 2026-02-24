import { useGetReceiptReview } from './use-get-receipt';
import type { ReceiptWithRoom } from '../server/get-receipt-service';

export function useReadyReceipt(
  receiptId: string,
  initialReceipt?: ReceiptWithRoom,
) {
  const { data } = useGetReceiptReview(receiptId, {
    initialData: initialReceipt,
  });

  if (!data) {
    throw new Error('Receipt not available');
  }

  return data;
}
