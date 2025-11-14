import { ReceiptItemDto, ReceiptTotalsDto } from "@/server/dtos";
import { editReceiptItemRpc, deleteReceiptItemRpc, createReceiptItemRpc, finalizeReceiptTotalsRpc } from "@/server/edit-receipt/rpc-put-receipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReceiptQueryKeys } from "./useGetReceipt";

export function useDeleteReceiptItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (args: { id: string, item: ReceiptItemDto }) => {
            return await deleteReceiptItemRpc({ data: args.item });
        },
        onSuccess: (_, variables) => {
            if (variables == null) return;
            queryClient.invalidateQueries({
                queryKey: ReceiptQueryKeys.detail(variables.id),
            });
            queryClient.invalidateQueries({
                queryKey: ReceiptQueryKeys.valid(variables.id),
            });
        },
        onError: (error) => {
            console.error('Failed to delete item:', error);
        }
    });
}

export function useCreateReceiptItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (args: { id: string, item: ReceiptItemDto }) => {
            return await createReceiptItemRpc({ data: { receiptId: args.id, receiptItem: args.item } });
        },
        onSuccess: (_, variables) => {
            if (variables == null) return;
            queryClient.invalidateQueries({
                queryKey: ReceiptQueryKeys.detail(variables.id),
            });
            queryClient.invalidateQueries({
                queryKey: ReceiptQueryKeys.valid(variables.id),
            });
        },
        onError: (error) => {
            console.error('Failed to save item:', error);
        }
    });
}

export function useEditReceiptItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (item: ReceiptItemDto) => {
            return await editReceiptItemRpc({ data: item });
        },
        onSuccess: (_, variables) => {
            if (variables == null) return;
            queryClient.invalidateQueries({
                queryKey: ReceiptQueryKeys.detail(variables.id),
            });
            queryClient.invalidateQueries({
                queryKey: ReceiptQueryKeys.valid(variables.id),
            });
        },
        onError: (error) => {
            console.error('Failed to save item:', error);
        }
    });
}

export function useFinalizeReceipt() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (item: ReceiptTotalsDto) => {
            return await finalizeReceiptTotalsRpc({ data: item });
        },
        onSuccess: (_, variables) => {
            if (variables == null) {
                return;
            }
            queryClient.invalidateQueries({
                queryKey: ReceiptQueryKeys.detail(variables?.id),
            });
            queryClient.invalidateQueries({
                queryKey: ReceiptQueryKeys.valid(variables?.id),
            });
        },
        onError: (error) => {
            console.error('Failed to save item:', error);
        }
    });
}
