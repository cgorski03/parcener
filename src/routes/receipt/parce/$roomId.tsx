import { RoomNotFound } from '@/components/layout/not-found';
import { ActiveRoomScreen } from '@/components/room/active-room-screen';
import { LobbyScreen } from '@/components/room/lobby-screen';
import { getRoomAndMembership } from '@/server/room/room-rpc'
import { createFileRoute, notFound, } from '@tanstack/react-router'


export const Route = createFileRoute('/receipt/parce/$roomId')({
    loader: async ({ params }) => {
        const response = await getRoomAndMembership({ data: params.roomId });
        if (!response.room) {
            throw notFound();
        }
        return { ...response }
    },
    component: RouteComponent,
    notFoundComponent: RoomNotFound,
})

function RouteComponent() {
    const { room, membership, user } = Route.useLoaderData();
    if (!room || !room.receipt) {
        throw notFound();
    }
    if (membership) {
        return <ActiveRoomScreen initialRoom={room} member={membership} />
    }
    return <LobbyScreen room={room} user={user} />
}
