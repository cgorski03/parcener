import { createRoomRpc, FullRoomInfo, getAllRoomInfoRpc } from "@/server/room/room-rpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const RoomQueryKeys = {
    all: ['room'] as const,
    detail: (id: string) => [...RoomQueryKeys.all, id] as const,
    pulse: (id: string) => [...RoomQueryKeys.all, 'pulse', id] as const,
};

// To optimize performance, this returns only a subset of ALL The room information - it will get the members, room object and claims
export const useGetRoomPulse = (roomId: string, initialData: FullRoomInfo) => {
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: RoomQueryKeys.detail(roomId),
        initialData,
        refetchInterval: 3000,

        queryFn: async ({ queryKey }) => {
            const currentCache = queryClient.getQueryData<FullRoomInfo>(queryKey);

            // 3. Calculate Since
            const lastSync = currentCache?.updatedAt ?? null;

            const response = await getAllRoomInfoRpc({
                data: { roomId, since: lastSync }
            });

            if (!response) throw new Error("Room not found");

            if (response.changed === false) {
                return currentCache!;
            }

            return response.data;
        },
    });
};
export function useCreateReceiptRoom() {
    return useMutation({
        mutationFn: async (receiptId: string) => {
            return await createRoomRpc({ data: receiptId });
        }, onError: (error) => {
            console.error('Failed to create receipt room', error);
        }
    });
}
