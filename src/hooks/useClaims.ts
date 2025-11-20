import { claimItemRpc } from "@/server/room/room-rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RoomQueryKeys } from "./useRoom";


export function useClaimItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (request: { roomId: string; receiptItemId: string; quantity: number }) => {
            await claimItemRpc({ data: { ...request } })
        }, onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: RoomQueryKeys.pulse(variables.roomId)
            })
        },
        onError: (error) => {
            console.error('Failed to create receipt room', error);
        },
    });
}
