import { RoomNotFound } from '@/components/layout/not-found'
import { ActiveRoomScreen } from '@/components/room/active-room-screen'
import { RoomLoading } from '@/components/room/loading-view'
import { LobbyScreen } from '@/components/room/lobby-screen'
import { getRoomAndMembership, upgradeGuestToUser } from '@/server/room/room-rpc'
import { createFileRoute, notFound } from '@tanstack/react-router'

type RoomView = 'items' | 'settlement'

type RoomSearch = {
    view: RoomView
}

export const Route = createFileRoute('/receipt/parce/$roomId')({

    loader: async ({ params }) => {
        const response = await getRoomAndMembership({ data: { roomId: params.roomId } })
        if (!response) {
            throw notFound()
        }
        const { room, membership, user, canMergeGuestToMember } = response;
        // This is something I don't love.
        // I don't think that the loader - for loading data
        // should be responsible for this
        // but at the same time, having a client component repsonsible for it also seems wrong
        // and i don't want to build it into a GET RPC
        if (canMergeGuestToMember) {
            const newMembership = await upgradeGuestToUser({ data: { roomId: params.roomId } });
            return { membership: newMembership, room, user }
        }
        return { room, membership, user }
    },
    head: () => ({
        meta: [
            { title: 'Room | Parcener' },
            { property: 'og:title', content: `Join Room | Parcener` },
            { property: 'og:description', content: 'Join room to share on expenses with your friends in real-time' },
        ],
    }),
    validateSearch: (search: Record<string, unknown>): RoomSearch => {
        // Fallback logic: If it's not 'settlement', force it to 'items'
        return {
            view: search.view === 'settlement' ? 'settlement' : 'items'
        }
    },
    component: RouteComponent,
    pendingComponent: RoomLoading,
    notFoundComponent: RoomNotFound,
})

function RouteComponent() {
    const { room, membership, user } = Route.useLoaderData()

    if (!room || !room.receipt) {
        throw notFound()
    }

    if (membership) {
        return <ActiveRoomScreen initialRoom={room} member={membership} />
    }

    return <LobbyScreen room={room} user={user} />
}
