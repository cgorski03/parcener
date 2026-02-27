import { useQuery } from '@tanstack/react-query';
import { getReceiptIsValidRpc, getReceiptRpc } from '../server/rpc-get-receipt';
import { isProcessing } from '../lib/receipt-utils';
import type { ReceiptWithRoom } from '../server/get-receipt-service';
import type { GetReceiptResponse } from '../server/responses';

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

export const receiptOptions = (receiptId: string) => ({
  queryKey: ReceiptQueryKeys.detail(receiptId),
  queryFn: () => getReceiptRpc({ data: receiptId }),
  staleTime: 1000,
});

export const receiptReviewOptions = (receiptId: string) => ({
  ...receiptOptions(receiptId),
  refetchInterval: (query: { state: { data?: GetReceiptResponse } }) => {
    const data = query.state.data;
    if (data && isProcessing(data)) {
      return 1500;
    }
    return false;
  },
});

export function useGetReceiptReview(
  receiptId: string,
  options: { enabled?: boolean; initialData?: ReceiptWithRoom } = {},
) {
  return useQuery({
    ...receiptReviewOptions(receiptId),
    ...options,
  });
}

export const useReceiptIsValid = (receiptId: string) =>
  useQuery({
    queryKey: ReceiptQueryKeys.valid(receiptId),
    queryFn: async () => {
      const response = await getReceiptIsValidRpc({ data: receiptId });
      if (
        response.processingStatus === 'success' &&
        response.validity.status === 'valid'
      ) {
        return response.receipt;
      }
      // TODO REFACTOR
      throw new Error('Error');
    },
    retry: false,
  });
