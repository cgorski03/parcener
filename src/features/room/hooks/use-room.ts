import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import {
  createRoomRpc,
  getRoomPulseRpc,
  joinRoomRpc,
  lockRoom,
  renameRoomRpc,
  unlockRoom,
  updateRoomHostPaymentMethod,
} from '../server/room-rpc';
import type {
  DefinedUseQueryResult,
  UseQueryResult,
} from '@tanstack/react-query';
import type {
  FullRoomInfoDto,
  JoinRoomRequest,
  PaymentMethodDto,
} from '@/shared/dto/types';
import { logger } from '@/shared/observability/logger';
import { SENTRY_EVENTS } from '@/shared/observability/sentry-events';
import { paymentMethodsOptions } from '@/features/payment-methods/hooks/use-payment-methods';

export const RoomQueryKeys = {
  all: ['room'] as const,
  joinRoom: ['joinRoom'] as const,
  createRoomMutationKey: ['createRoom'] as const,
  renameRoomMutationKey: (id: string) => ['renameRoom', id] as const,
  lockRoomMutationKey: (id: string) => ['lockRoom', id] as const,
  unlockRoomMutationKey: (id: string) => ['unlockRoom', id] as const,
  detail: (id: string) => [...RoomQueryKeys.all, id] as const,
  recents: () => [...RoomQueryKeys.all, 'recents'] as const,
};

export function useGetRoomPulse(
  roomId: string,
): UseQueryResult<FullRoomInfoDto, Error>;

// 2. Overload for when initialData IS provided (guaranteed to be defined)
export function useGetRoomPulse(
  roomId: string,
  initialData: FullRoomInfoDto,
): DefinedUseQueryResult<FullRoomInfoDto, Error>;

// 3. The Implementation
export function useGetRoomPulse(roomId: string, initialData?: FullRoomInfoDto) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: RoomQueryKeys.detail(roomId),
    initialData: initialData,
    refetchInterval: 1750,
    queryFn: async () => {
      const currentCache = queryClient.getQueryData<FullRoomInfoDto>(
        RoomQueryKeys.detail(roomId),
      );
      const lastSync = currentCache?.updatedAt ?? null;

      const response = await getRoomPulseRpc({
        data: { roomId, since: lastSync },
      });

      if (!response) throw new Error('Room not found');

      // If nothing changed, return the cache
      if (response.changed === false) {
        if (!currentCache) throw new Error('Cache lost and no update provided');
        return currentCache;
      }

      return response.data;
    },
  });
}

export function useCreateReceiptRoom() {
  const { data: myPaymentMethods } = useQuery(paymentMethodsOptions(true));

  return useMutation({
    mutationFn: async ({
      receiptId,
      sharePayment,
    }: {
      receiptId: string;
      sharePayment: boolean;
    }) => {
      const defaultMethod = sharePayment
        ? myPaymentMethods?.find((pm) => pm.isDefault) || myPaymentMethods?.[0]
        : null;

      return await createRoomRpc({
        data: {
          receiptId,
          paymentMethodId: defaultMethod?.paymentMethodId ?? null,
        },
      });
    },
  });
}

export function useJoinRoom() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationKey: RoomQueryKeys.joinRoom,
    mutationFn: async (request: JoinRoomRequest) => {
      return await joinRoomRpc({ data: request });
    },
    onSuccess: (response, variables) => {
      const cookieName = `guest_uuid_room_${variables.roomId}`;
      const maxAge = 60 * 60 * 24 * 7;
      document.cookie = `${cookieName}=${response.generatedUuid}; path=/; max-age=${maxAge}; SameSite=Lax`;
      router.invalidate();
      queryClient.invalidateQueries({ queryKey: RoomQueryKeys.recents() });
    },
  });
  return {
    ...mutation,
    joinRoom: mutation.mutate,
  };
}

/**
 * Hook to update the payment method used for a specific room.
 * This links a user's payment method (Venmo, etc) to the room host.
 */
export const useUpdateRoomPaymentMethod = (roomId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentMethod: PaymentMethodDto | null) => {
      return await updateRoomHostPaymentMethod({
        data: {
          roomId,
          paymentMethodId: paymentMethod?.paymentMethodId ?? null,
        },
      });
    },

    onMutate: async (newPaymentMethod) => {
      const queryKey = RoomQueryKeys.detail(roomId);
      await queryClient.cancelQueries({ queryKey });
      const previousRoom = queryClient.getQueryData<FullRoomInfoDto>(queryKey);

      if (previousRoom) {
        queryClient.setQueryData<FullRoomInfoDto>(queryKey, {
          ...previousRoom,
          hostPaymentInformation:
            newPaymentMethod === null
              ? null
              : {
                  type: newPaymentMethod.type,
                  handle: newPaymentMethod.handle,
                },
        });
      }

      // Return a context object with the snapshotted value
      return { previousRoom };
    },

    onError: (error, _, context) => {
      // 4. Rollback to the previous state if the mutation fails
      if (context?.previousRoom) {
        queryClient.setQueryData(
          RoomQueryKeys.detail(roomId),
          context.previousRoom,
        );
      }

      logger.error(error, SENTRY_EVENTS.ROOM.UPDATE_PAYMENT_METHOD_ID, {
        roomId,
      });
    },

    onSettled: () => {
      // 5. Always refetch after error or success to ensure we are in sync with the server
      queryClient.invalidateQueries({ queryKey: RoomQueryKeys.detail(roomId) });
    },
  });
};

export const useRenameRoom = (roomId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTitle: string) => {
      return await renameRoomRpc({ data: { roomId, newTitle } });
    },
    mutationKey: RoomQueryKeys.renameRoomMutationKey(roomId),
    onMutate: async (newTitle) => {
      const queryKey = RoomQueryKeys.detail(roomId);
      await queryClient.cancelQueries({ queryKey });
      const previousRoom = queryClient.getQueryData<FullRoomInfoDto>(queryKey);

      if (previousRoom) {
        queryClient.setQueryData<FullRoomInfoDto>(queryKey, {
          ...previousRoom,
          title: newTitle,
        });
      }

      return { previousRoom };
    },
    onError: (error, _, context) => {
      if (context?.previousRoom) {
        queryClient.setQueryData(
          RoomQueryKeys.detail(roomId),
          context.previousRoom,
        );
      }
      logger.error(error, SENTRY_EVENTS.ROOM.RENAME, { roomId });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RoomQueryKeys.detail(roomId) });
      queryClient.invalidateQueries({ queryKey: RoomQueryKeys.recents() });
    },
  });
};

export const useLockRoom = (roomId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await lockRoom({ data: { roomId } });
    },
    mutationKey: RoomQueryKeys.lockRoomMutationKey(roomId),
    onMutate: async () => {
      const queryKey = RoomQueryKeys.detail(roomId);
      await queryClient.cancelQueries({ queryKey });
      const previousRoom = queryClient.getQueryData<FullRoomInfoDto>(queryKey);

      if (previousRoom) {
        queryClient.setQueryData<FullRoomInfoDto>(queryKey, {
          ...previousRoom,
          status: 'locked',
        });
      }

      return { previousRoom };
    },
    onError: (error, _, context) => {
      if (context?.previousRoom) {
        queryClient.setQueryData(
          RoomQueryKeys.detail(roomId),
          context.previousRoom,
        );
      }
      logger.error(error, SENTRY_EVENTS.ROOM.LOCK, { roomId });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RoomQueryKeys.detail(roomId) });
      queryClient.invalidateQueries({ queryKey: RoomQueryKeys.recents() });
    },
  });
};

export const useUnlockRoom = (roomId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await unlockRoom({ data: { roomId } });
    },
    mutationKey: RoomQueryKeys.unlockRoomMutationKey(roomId),
    onMutate: async () => {
      const queryKey = RoomQueryKeys.detail(roomId);
      await queryClient.cancelQueries({ queryKey });
      const previousRoom = queryClient.getQueryData<FullRoomInfoDto>(queryKey);

      if (previousRoom) {
        queryClient.setQueryData<FullRoomInfoDto>(queryKey, {
          ...previousRoom,
          status: 'active',
        });
      }

      return { previousRoom };
    },
    onError: (error, _, context) => {
      if (context?.previousRoom) {
        queryClient.setQueryData(
          RoomQueryKeys.detail(roomId),
          context.previousRoom,
        );
      }
      logger.error(error, SENTRY_EVENTS.ROOM.UNLOCK, { roomId });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RoomQueryKeys.detail(roomId) });
      queryClient.invalidateQueries({ queryKey: RoomQueryKeys.recents() });
    },
  });
};
