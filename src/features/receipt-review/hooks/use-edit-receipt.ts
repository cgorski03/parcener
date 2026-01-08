import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ReceiptQueryKeys } from './use-get-receipt';
import type {
  CreateReceiptItemDto,
  ReceiptItemDto,
  ReceiptTotalsDto,
} from '@/shared/dto/types';
import { ReceiptWithRoom } from '../server/get-receipt-service';
import {
  createReceiptItemRpc,
  deleteReceiptItemRpc,
  editReceiptItemRpc,
  finalizeReceiptTotalsRpc,
} from '../server/rpc-put-receipt';
import { RoomQueryKeys } from '@/features/room/hooks/use-room';

// --- HELPER FOR CACHE UPDATES ---
const updateReceiptCache = (
  queryClient: any,
  receiptId: string,
  updater: (old: ReceiptWithRoom) => ReceiptWithRoom,
) => {
  const queryKey = ReceiptQueryKeys.detail(receiptId);
  queryClient.setQueryData(queryKey, (old: ReceiptWithRoom | undefined) => {
    if (!old) return old;
    return updater(old);
  });
};

export function useCreateReceiptItem(roomId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ReceiptQueryKeys.createItem,
    mutationFn: async (args: {
      receiptId: string;
      item: CreateReceiptItemDto;
    }) => {
      return await createReceiptItemRpc({
        data: { receiptId: args.receiptId, receiptItem: args.item },
      });
    },
    onMutate: async ({ receiptId, item }) => {
      const queryKey = ReceiptQueryKeys.detail(receiptId);
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<ReceiptWithRoom>(queryKey);

      // Optimistically add the item
      updateReceiptCache(queryClient, receiptId, (old) => ({
        ...old,
        items: [
          ...old.items,
          {
            ...item,
            receiptItemId: 'optimistic-id-' + Math.random(), // Temporary ID
            rawText: null,
          },
        ],
      }));

      return { previousData };
    },
    onError: (_, { receiptId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ReceiptQueryKeys.detail(receiptId),
          context.previousData,
        );
      }
    },
    onSettled: (_, __, { receiptId }) => {
      queryClient.invalidateQueries({
        queryKey: ReceiptQueryKeys.detail(receiptId),
      });
      queryClient.invalidateQueries({
        queryKey: ReceiptQueryKeys.valid(receiptId),
      });
      if (roomId)
        queryClient.invalidateQueries({
          queryKey: RoomQueryKeys.detail(roomId),
        });
    },
  });
}

export function useEditReceiptItem(receiptId: string, roomId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ReceiptQueryKeys.updateItem,
    mutationFn: async (item: ReceiptItemDto) => {
      return await editReceiptItemRpc({ data: item });
    },
    onMutate: async (updatedItem) => {
      const queryKey = ReceiptQueryKeys.detail(receiptId);
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<ReceiptWithRoom>(queryKey);

      updateReceiptCache(queryClient, receiptId, (old) => ({
        ...old,
        items: old.items.map((i) =>
          i.receiptItemId === updatedItem.receiptItemId ? updatedItem : i,
        ),
      }));

      return { previousData };
    },
    onError: (_, __, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ReceiptQueryKeys.detail(receiptId),
          context.previousData,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ReceiptQueryKeys.detail(receiptId),
      });
      queryClient.invalidateQueries({
        queryKey: ReceiptQueryKeys.valid(receiptId),
      });
      if (roomId)
        queryClient.invalidateQueries({
          queryKey: RoomQueryKeys.detail(roomId),
        });
    },
  });
}

export function useDeleteReceiptItem(roomId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ReceiptQueryKeys.deleteItem,
    mutationFn: async (args: { receiptId: string; item: ReceiptItemDto }) => {
      return await deleteReceiptItemRpc({ data: args.item });
    },
    onMutate: async ({ receiptId, item }) => {
      const queryKey = ReceiptQueryKeys.detail(receiptId);
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<ReceiptWithRoom>(queryKey);

      updateReceiptCache(queryClient, receiptId, (old) => ({
        ...old,
        items: old.items.filter((i) => i.receiptItemId !== item.receiptItemId),
      }));

      return { previousData };
    },
    onError: (_, { receiptId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ReceiptQueryKeys.detail(receiptId),
          context.previousData,
        );
      }
    },
    onSettled: (_, __, { receiptId }) => {
      queryClient.invalidateQueries({
        queryKey: ReceiptQueryKeys.detail(receiptId),
      });
      queryClient.invalidateQueries({
        queryKey: ReceiptQueryKeys.valid(receiptId),
      });
      if (roomId)
        queryClient.invalidateQueries({
          queryKey: RoomQueryKeys.detail(roomId),
        });
    },
  });
}

export function useFinalizeReceipt(roomId: string | null) {
  const queryClient = useQueryClient();
  const _linkedRoom = roomId;

  return useMutation({
    mutationKey: ReceiptQueryKeys.finalize,
    mutationFn: async (item: ReceiptTotalsDto) => {
      return await finalizeReceiptTotalsRpc({ data: item });
    },
    onSuccess: (_, item) => {
      if (item == null) return;
      queryClient.invalidateQueries({
        queryKey: ReceiptQueryKeys.detail(item.receiptId),
      });
      queryClient.invalidateQueries({
        queryKey: ReceiptQueryKeys.valid(item.receiptId),
      });
      if (_linkedRoom) {
        queryClient.invalidateQueries({
          queryKey: RoomQueryKeys.detail(_linkedRoom),
        });
      }
    },
  });
}
