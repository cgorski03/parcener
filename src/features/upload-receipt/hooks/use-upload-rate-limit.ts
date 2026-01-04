import { useQuery } from '@tanstack/react-query'
import { UploadQueryKeys } from './use-upload-receipt'

export function useUploadRateLimit() {
    return useQuery({
        queryKey: UploadQueryKeys.rateLimit(),
        queryFn: async () => {
            const limits = await getUserUploadRateLimitRpc()
            return limits
        },
        staleTime: 1000 * 60 * 5,
    })
}
