import { ReceiptItemDto } from "@/server/dtos";
import { editReceiptItemRpc, deleteReceiptItemRpc, createReceiptItemRpc } from "@/server/edit-receipt/rpc-put-receipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteReceiptItem(receiptId: string) {
    const _receiptId = receiptId;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (item: ReceiptItemDto) => {
            return await deleteReceiptItemRpc({ data: item });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['receipt', _receiptId]
            });
        },
        onError: (error) => {
            console.error('Failed to delete item:', error);
        }
    });
}

export function useCreateReceiptItem(receiptId: string) {
    const _receiptId = receiptId;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (item: ReceiptItemDto) => {
            return await createReceiptItemRpc({ data: { receiptId, receiptItem: item } });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['receipt', _receiptId]
            });
        },
        onError: (error) => {
            console.error('Failed to save item:', error);
        }
    });
}

export function useEditReceiptItem(receiptId: string) {
    const _receiptId = receiptId;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (item: ReceiptItemDto) => {
            return await editReceiptItemRpc({ data: item });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['receipt', _receiptId]
            });
        },
        onError: (error) => {
            console.error('Failed to save item:', error);
        }
    });
}
