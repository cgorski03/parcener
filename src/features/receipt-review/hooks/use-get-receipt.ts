import { useQuery } from '@tanstack/react-query';
import { getReceiptIsValidRpc, getReceiptRpc } from '../server/rpc-get-receipt';
import { isProcessing } from '../lib/receipt-utils';
import type { ReceiptWithRoom } from '../server/get-receipt-service';

export const ReceiptQueryKeys = {
  all: ['receipts'] as const,
  validation: ['validations'] as const,
  upload: ['uploadReceipt'] as const,
  deleteItem: ['deleteItem'] as const,
  createItem: ['createItem'] as const,
  updateItem: ['updateItem'] as const,
  finalize: ['finalizeReceipt'] as const,
  recents: () => [...ReceiptQueryKeys.all, 'recents'] as const,
  detail: (id: string) => [...ReceiptQueryKeys.all, id] as const,
  valid: (id: string) => [...ReceiptQueryKeys.validation, id] as const,
};

export function useGetReceiptReview(
  receiptId: string,
  options: { enabled?: boolean; initialData?: ReceiptWithRoom } = {},
) {
  return useQuery({
    // Use your constants for consistency
    queryKey: ReceiptQueryKeys.detail(receiptId),
    queryFn: () => getReceiptRpc({ data: receiptId }),
    // If data is "processing", poll every 2 seconds. Otherwise stop.
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && isProcessing(data)) {
        return 2000;
      }
      return false;
    },
    staleTime: 1000,
    ...options,
  });
}

export const useReceiptIsValid = (receiptId: string) =>
  useQuery({
    queryKey: ReceiptQueryKeys.valid(receiptId),
    queryFn: async () => {
      const response = await getReceiptIsValidRpc({ data: receiptId });
      if (response.status === 'valid') {
        return response.receipt;
      }
      // TODO REFACTOR
      throw new Error('Error');
    },
    retry: false,
  });
