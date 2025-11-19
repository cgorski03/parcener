import { useQuery } from "@tanstack/react-query";

export const RoomQueryKeys = {
    all: ['room'] as const,
    detail: (id: string) => [...RoomQueryKeys.all, id] as const,
    pulse: (id: string) => [...RoomQueryKeys.all, 'pulse', id] as const,
};

export const useGetReceiptRoom = (roomId: string) => useQuery({
    queryKey: RoomQueryKeys.detail(roomId),
    queryFn: () => ([]),
    refetchInterval: 3000,
});
