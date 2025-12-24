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
            return await getUserUploadRateLimitRpc();
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
            return await getUserInviteRateLimitRpc();
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
            return await createInviteRpc();
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

        onError: (_, __, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(['inviteRateLimit'], context.previousData);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['inviteRateLimit'] });
        },
    });
};
