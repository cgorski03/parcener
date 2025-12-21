import { getUserRecentRoomsRpc } from '@/server/account/account-rpc'
import { FullRoomInfoDto, JoinRoomRequest } from '@/server/dtos'
import { createRoomRpc, getRoomPulseRpc, joinRoomRpc } from '@/server/room/room-rpc'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

export const RoomQueryKeys = {
    all: ['room'] as const,
    joinRoom: ['joinRoom'] as const,
    createRoom: ['createRoom'] as const,
    detail: (id: string) => [...RoomQueryKeys.all, id] as const,
    recents: () => [...RoomQueryKeys.all, 'recents'] as const,
}

// To optimize performance, this returns only a subset of ALL The room information - it will get the members, room object and claims
export const useGetRoomPulse = (initialData: FullRoomInfoDto) => {
    const _id = initialData.roomId
    const queryClient = useQueryClient()

    return useQuery({
        queryKey: RoomQueryKeys.detail(_id),
        initialData,
        refetchInterval: 3000,

        queryFn: async ({ queryKey }) => {
            const currentCache = queryClient.getQueryData<FullRoomInfoDto>(queryKey)

            // 3. Calculate Since
            const lastSync = currentCache?.updatedAt ?? null

            const response = await getRoomPulseRpc({
                data: { roomId: _id, since: lastSync },
            })

            if (!response) throw new Error('Room not found')

            if (response.changed === false) {
                return currentCache!
            }

            return response.data
        },

    })
}

export function useRecentRooms() {
    return useQuery({
        queryKey: [...RoomQueryKeys.all, 'recent'],
        queryFn: async () => await getUserRecentRoomsRpc(),
        staleTime: 1000 * 60 * 5,
    });
}


export function useCreateReceiptRoom() {
    return useMutation({
        mutationKey: RoomQueryKeys.createRoom,
        mutationFn: async (receiptId: string) => {
            return await createRoomRpc({ data: receiptId })
        },
    })
}

export function useJoinRoom() {
    const queryClient = useQueryClient();
    const router = useRouter()

    const mutation = useMutation({
        mutationKey: RoomQueryKeys.joinRoom,
        mutationFn: async (request: JoinRoomRequest) => {
            return await joinRoomRpc({ data: request })
        },
        onSuccess: (response, variables) => {
            const cookieName = `guest_uuid_room_${variables.roomId}`
            const maxAge = 60 * 60 * 24 * 7
            document.cookie = `${cookieName}=${response.generatedUuid}; path=/; max-age=${maxAge}; SameSite=Lax`
            router.invalidate()
            queryClient.invalidateQueries({ queryKey: RoomQueryKeys.recents() })
        }
    })
    return {
        ...mutation,
        joinRoom: mutation.mutate,
    }
}
