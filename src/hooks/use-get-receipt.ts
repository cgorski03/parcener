import { isProcessing } from '@/lib/receipt-utils'
import { getUserRecentReceipts } from '@/server/account/account-rpc'
import {
    getReceiptRpc,
    getReceiptIsValidRpc,
} from '@/server/get-receipt/rpc-get-receipt'
import { useQuery, useQueryClient } from '@tanstack/react-query'

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
}

export function useGetReceiptReview(
    receiptId: string,
    options: { enabled?: boolean } = {},
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
    })
}


export function useRecentReceipts() {
    const queryClient = useQueryClient();
    return useQuery({
        queryKey: ReceiptQueryKeys.recents(),
        queryFn: async () => {
            const receipts = await getUserRecentReceipts();
            if (!receipts) {
                return [];
            }
            const filteredReceipts = receipts.filter((receipt) => receipt != null);
            // Seed the individual caches
            filteredReceipts.forEach(receipt => {
                queryClient.setQueryData(
                    ReceiptQueryKeys.detail(receipt?.receiptId),
                    receipt,
                    { updatedAt: Date.now() }
                );
            });
            return filteredReceipts;
        },
        staleTime: 1000 * 60 * 5,
    });
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
