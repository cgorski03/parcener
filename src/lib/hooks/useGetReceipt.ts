import { getReceipt } from "@/server/get-receipt/rpc-get-receipt";
import { useQuery } from "@tanstack/react-query";

export const useGetReceipt = (receiptId: string) => useQuery({
    queryKey: ['receipt', receiptId],
    queryFn: () => getReceipt({ data: receiptId }),
    refetchInterval: 3000,
});
