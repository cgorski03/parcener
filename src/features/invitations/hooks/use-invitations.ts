import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createInviteRpc,
  getUserInviteRateLimitRpc,
} from '../server/invitation-rpc';

export const InvitationQueryKeys = {
  inviteRateLimit: ['invitationRateLimit'] as const,
};

export const inviteRateLimitOptions = queryOptions({
  queryKey: InvitationQueryKeys.inviteRateLimit,
  queryFn: async () => {
    return await getUserInviteRateLimitRpc();
  },
  staleTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  retry: 2,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

export const useCreateInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await createInviteRpc();
    },

    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: InvitationQueryKeys.inviteRateLimit,
      });
      const previousData = queryClient.getQueryData(
        InvitationQueryKeys.inviteRateLimit,
      );
      queryClient.setQueryData(
        InvitationQueryKeys.inviteRateLimit,
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            used: old.used + 1,
            canInvite: old.used + 1 < old.limit,
          };
        },
      );

      return { previousData };
    },

    onError: (_, __, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          InvitationQueryKeys.inviteRateLimit,
          context.previousData,
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: InvitationQueryKeys.inviteRateLimit,
      });
    },
  });
};
