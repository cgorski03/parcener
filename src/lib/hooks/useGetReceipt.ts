import { GetReceiptResponse } from "@/server/get-receipt/get-receipt-service";
import { getReceipt } from "@/server/get-receipt/rpc-get-receipt";
import { useQuery } from "@tanstack/react-query";

export const useGetReceiptRoom = (receiptId: string) => useQuery({
    queryKey: ['receipt', receiptId],
    queryFn: () => getReceipt({ data: receiptId }),
    refetchInterval: 3000,
});

export const useGetReceiptReview = (receiptId: string, initialData?: GetReceiptResponse) => useQuery({
    queryKey: ['receipt', receiptId],
    queryFn: () => getReceipt({ data: receiptId }),
    initialData,
});
