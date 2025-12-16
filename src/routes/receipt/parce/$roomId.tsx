import { RoomNotFound } from '@/components/layout/not-found'
import { ActiveRoomScreen } from '@/components/room/active-room-screen'
import { LobbyScreen } from '@/components/room/lobby-screen'
import { getRoomAndMembership } from '@/server/room/room-rpc'
import { createFileRoute, notFound } from '@tanstack/react-router'
import z from 'zod'

const roomSearchSchema = z.object({
    view: z.enum(['items', 'settlement']).default('items'),
})

export const Route = createFileRoute('/receipt/parce/$roomId')({
    loader: async ({ params }) => {
        const response = await getRoomAndMembership({ data: params.roomId })
        if (!response) {
            throw notFound()
        }
        return { ...response }
    },
    validateSearch: (search) => roomSearchSchema.parse(search),
    component: RouteComponent,
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
