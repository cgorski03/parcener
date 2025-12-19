import { uploadReceipt } from "@/server/processing/rpc-processing"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ReceiptQueryKeys } from "./use-get-receipt"
import { RateLimitQueryKeys } from "./use-account"

export function useUploadReceipt() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: FormData) => {
            return await uploadReceipt({ data })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ReceiptQueryKeys.recents(),
            })
            queryClient.invalidateQueries({
                queryKey: RateLimitQueryKeys.upload,
            })
        },
        onError: (error) => {
            console.error('Failed to save item:', error)
        },
    })
}
