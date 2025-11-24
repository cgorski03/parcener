import { createRoomRpc, getRoomPulseRpc } from "@/server/room/room-rpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const RoomQueryKeys = {
    all: ['room'] as const,
    detail: (id: string) => [...RoomQueryKeys.all, id] as const,
};

// To optimize performance, this returns only a subset of ALL The room information - it will get the members, room object and claims
export const useGetRoomPulse = (initialData: FullRoomInfoDto) => {
    const _id = initialData.id;
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: RoomQueryKeys.detail(_id),
        initialData,
        refetchInterval: 3000,

        queryFn: async ({ queryKey }) => {
            const currentCache = queryClient.getQueryData<FullRoomInfoDto>(queryKey);

            // 3. Calculate Since
            const lastSync = currentCache?.updatedAt ?? null;

            const response = await getRoomPulseRpc({
                data: { roomId: _id, since: lastSync }
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
