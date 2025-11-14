import { GetReceiptResponse } from "@/server/get-receipt/get-receipt-service";
import { getReceiptRpc, getReceiptIsValidRpc } from "@/server/get-receipt/rpc-get-receipt";
import { useQuery } from "@tanstack/react-query";

export const ReceiptQueryKeys = {
    all: ['receipts'] as const,
    validation: ['validations'] as const,
    detail: (id: string) => [...ReceiptQueryKeys.all, id] as const,
    valid: (id: string) => [...ReceiptQueryKeys.validation, id] as const,
};

export const useGetReceiptRoom = (receiptId: string) => useQuery({
    queryKey: ReceiptQueryKeys.detail(receiptId),
    queryFn: () => getReceiptRpc({ data: receiptId }),
    refetchInterval: 3000,
});

export const useGetReceiptReview = (receiptId: string, initialData?: GetReceiptResponse) => useQuery({
    queryKey: ReceiptQueryKeys.detail(receiptId),
    queryFn: () => getReceiptRpc({ data: receiptId }),
    initialData,
});

export const useReceiptIsValid = (receiptId: string) => useQuery({
    queryKey: ReceiptQueryKeys.valid(receiptId),
    queryFn: async () => {
        const response = await getReceiptIsValidRpc({ data: receiptId })
        if ('success' in response) {
            return response.success
        }
        // This is TERRIBLE handling lol
        throw new Error(response.code);
    },
    retry: false
});
