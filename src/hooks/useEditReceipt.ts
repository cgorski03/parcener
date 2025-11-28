import { ReceiptItemDto, ReceiptTotalsDto } from '@/server/dtos'
import {
    editReceiptItemRpc,
    deleteReceiptItemRpc,
    createReceiptItemRpc,
    finalizeReceiptTotalsRpc,
} from '@/server/edit-receipt/rpc-put-receipt'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ReceiptQueryKeys } from './useGetReceipt'

export function useDeleteReceiptItem() {
    const queryClient = useQueryClient()

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
        },
        onError: (error) => {
            console.error('Failed to delete item:', error)
        },
    })
}

export function useCreateReceiptItem() {
    const queryClient = useQueryClient()

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
        },
        onError: (error) => {
            console.error('Failed to save item:', error)
        },
    })
}

export function useEditReceiptItem(receiptId: string) {
    const queryClient = useQueryClient()
    const _receiptId = receiptId
    return useMutation({
        mutationFn: async (item: ReceiptItemDto) => {
            return await editReceiptItemRpc({ data: item })
        },
        onSuccess: () => {
            console.log(_receiptId)
            queryClient.invalidateQueries({
                queryKey: ReceiptQueryKeys.detail(_receiptId),
            })
            queryClient.invalidateQueries({
                queryKey: ReceiptQueryKeys.valid(_receiptId),
            })
        },
        onError: (error) => {
            console.error('Failed to save item:', error)
        },
    })
}

export function useFinalizeReceipt() {
    const queryClient = useQueryClient()

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
        },
        onError: (error) => {
            console.error('Failed to save item:', error)
        },
    })
}
