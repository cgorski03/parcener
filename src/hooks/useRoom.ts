import { createRoomRpc, FullRoomInfo, getAllRoomInfoRpc } from "@/server/room/room-rpc";
import { useMutation, useQuery } from "@tanstack/react-query";

export const RoomQueryKeys = {
    all: ['room'] as const,
    detail: (id: string) => [...RoomQueryKeys.all, id] as const,
    pulse: (id: string) => [...RoomQueryKeys.all, 'pulse', id] as const,
};

// To optimize performance, this returns only a subset of ALL The room information - it will get the members, room object and claims
export const useGetRoomPulse = (roomId: string, initialData: FullRoomInfo) => useQuery({
    queryKey: RoomQueryKeys.detail(roomId),
    queryFn: () => (getAllRoomInfoRpc({ data: roomId })),
    initialData,
    refetchInterval: 3000,
});

export function useCreateReceiptRoom() {
    return useMutation({
        mutationFn: async (receiptId: string) => {
            return await createRoomRpc({ data: receiptId });
        }, onError: (error) => {
            console.error('Failed to create receipt room', error);
        }
    });
}
