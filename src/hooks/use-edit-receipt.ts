import { ReceiptItemDto, ReceiptTotalsDto } from '@/server/dtos'
import {
    editReceiptItemRpc,
    deleteReceiptItemRpc,
    createReceiptItemRpc,
    finalizeReceiptTotalsRpc,
} from '@/server/edit-receipt/rpc-put-receipt'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ReceiptQueryKeys } from './use-get-receipt'
import { RoomQueryKeys } from './use-room'

export function useDeleteReceiptItem(roomId: string | null) {
    const queryClient = useQueryClient()
    const _linkedRoom = roomId;
    return useMutation({
        mutationFn: async (args: { receiptId: string; item: ReceiptItemDto }) => {
            return await deleteReceiptItemRpc({ data: args.item })
        },
        onSuccess: (_, { receiptId }) => {
            queryClient.invalidateQueries({
                queryKey: ReceiptQueryKeys.detail(receiptId),
            })
            queryClient.invalidateQueries({
                queryKey: ReceiptQueryKeys.valid(receiptId),
            })

            if (_linkedRoom) {
                queryClient.invalidateQueries({
                    queryKey: RoomQueryKeys.detail(_linkedRoom),
                })
            }
        },
        onError: (error) => {
            console.error('Failed to delete item:', error)
        },
    })
}

export function useCreateReceiptItem(roomId: string | null) {
    const queryClient = useQueryClient()
    const _linkedRoom = roomId;
    return useMutation({
        mutationFn: async (args: { receiptId: string; item: ReceiptItemDto }) => {
            return await createReceiptItemRpc({
                data: { receiptId: args.receiptId, receiptItem: args.item },
            })
        },
        onSuccess: (_, { receiptId }) => {
            queryClient.invalidateQueries({
                queryKey: ReceiptQueryKeys.detail(receiptId),
            })
            queryClient.invalidateQueries({
                queryKey: ReceiptQueryKeys.valid(receiptId),
            })

            if (_linkedRoom) {
                queryClient.invalidateQueries({
                    queryKey: RoomQueryKeys.detail(_linkedRoom),
                })
            }
        },
        onError: (error) => {
            console.error('Failed to save item:', error)
        },
    })
}

export function useEditReceiptItem(receiptId: string, roomId: string | null) {
    const queryClient = useQueryClient();
    const _receiptId = receiptId;
    const _linkedRoom = roomId;
    return useMutation({
        mutationFn: async (item: ReceiptItemDto) => {
            return await editReceiptItemRpc({ data: item })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ReceiptQueryKeys.detail(_receiptId),
            });
            queryClient.invalidateQueries({
                queryKey: ReceiptQueryKeys.valid(_receiptId),
            });
            if (_linkedRoom) {
                queryClient.invalidateQueries({
                    queryKey: RoomQueryKeys.detail(_linkedRoom),
                });
            }
        },
        onError: (error) => {
            console.error('Failed to save item:', error)
        },
    })
}

export function useFinalizeReceipt(roomId: string | null) {
    const queryClient = useQueryClient()
    const _linkedRoom = roomId;

    return useMutation({
        mutationFn: async (item: ReceiptTotalsDto) => {
            return await finalizeReceiptTotalsRpc({ data: item })
        },
        onSuccess: (_, item) => {
            if (item == null) return
            queryClient.invalidateQueries({
                queryKey: ReceiptQueryKeys.detail(item.receiptId),
            })
            queryClient.invalidateQueries({
                queryKey: ReceiptQueryKeys.valid(item.receiptId),
            })
            if (_linkedRoom) {
                queryClient.invalidateQueries({
                    queryKey: RoomQueryKeys.detail(_linkedRoom),
                });
            }
        },
        onError: (error) => {
            console.error('Failed to save item:', error)
        },
    })
}
