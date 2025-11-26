import { isProcessing } from '@/lib/receipt-utils'
import { GetReceiptResponse } from '@/server/get-receipt/get-receipt-service'
import {
  getReceiptRpc,
  getReceiptIsValidRpc,
} from '@/server/get-receipt/rpc-get-receipt'
import { useQuery } from '@tanstack/react-query'

export const ReceiptQueryKeys = {
  all: ['receipts'] as const,
  validation: ['validations'] as const,
  detail: (id: string) => [...ReceiptQueryKeys.all, id] as const,
  valid: (id: string) => [...ReceiptQueryKeys.validation, id] as const,
}

export function useGetReceiptReview(
  receiptId: string,
  initialData?: GetReceiptResponse,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    // Use your constants for consistency
    queryKey: ReceiptQueryKeys.detail(receiptId),
    queryFn: () => getReceiptRpc({ data: receiptId }),
    initialData,
    // If data is "processing", poll every 2 seconds. Otherwise stop.
    refetchInterval: (query) => {
      const data = query.state.data
      if (data && isProcessing(data)) {
        return 2000
      }
      return false
    },
    staleTime: 1000,
    ...options,
  })
}

export const useReceiptIsValid = (receiptId: string) =>
  useQuery({
    queryKey: ReceiptQueryKeys.valid(receiptId),
    queryFn: async () => {
      const response = await getReceiptIsValidRpc({ data: receiptId })
      if ('success' in response) {
        return response.success
      }
      // This is TERRIBLE handling lol
      throw new Error(response.code)
    },
    retry: false,
  })
