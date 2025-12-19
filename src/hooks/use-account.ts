import {
    createInviteRpc,
    getUserInviteRateLimitRpc,
    getUserUploadRateLimitRpc
} from "@/server/account/account-rpc"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const RateLimitQueryKeys = {
    upload: ['uploadRateLimit'] as const,
    invite: ['inviteRateLimit'] as const,
}

export const useUploadRateLimit = () => {
    return useQuery({
        queryKey: RateLimitQueryKeys.upload,
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
        queryKey: RateLimitQueryKeys.invite,
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

export const useCreateInvitation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const result = await createInviteRpc();
            if (!result.success) {
                throw new Error(result.message || 'Failed to create invitation');
            }
            if (result.data.status !== "SUCCESS") {
                if (result.data.status === "RATE_LIMIT") {
                    throw new Error("You've reached your daily invitation limit");
                }
                throw new Error("Failed to create invitation");
            }
            return result.data;
        },

        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['inviteRateLimit'] });
            const previousData = queryClient.getQueryData(['inviteRateLimit']);
            queryClient.setQueryData(['inviteRateLimit'], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    used: old.used + 1,
                    canInvite: old.used + 1 < old.limit,
                };
            });

            return { previousData };
        },

        onError: (error, _, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(['inviteRateLimit'], context.previousData);
            }
            console.error("Invitation creation failed:", error);
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['inviteRateLimit'] });
        },
    });
};
