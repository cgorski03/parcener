import {
    getUserInviteRateLimitRpc,
    getUserUploadRateLimitRpc
} from "@/server/account/account-rpc"
import { useQuery } from "@tanstack/react-query"


export const useUploadRateLimit = () => {
    return useQuery({
        queryKey: ['uploadRateLimit'],
        queryFn: async () => {
            const result = await getUserUploadRateLimitRpc();
            if (!result.success) {
                throw new Error(result.message || 'Failed to fetch rate limit');
            }
            return result.data;
        },
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 2,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
};

export const useInviteRateLimit = () => {
    return useQuery({
        queryKey: ['inviteRateLimit'],
        queryFn: async () => {
            const result = await getUserInviteRateLimitRpc();
            if (!result.success) {
                throw new Error(result.message || 'Failed to fetch rate limit');
            }
            return result.data;
        },
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 2,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
};
