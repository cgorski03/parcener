import { getAllRoomInfo, joinRoomRpc } from '@/server/room/room-rpc'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/parce/$roomId')({
    loader: async ({ params }) => {
        const joinResponse = await joinRoomRpc({ data: params.roomId });
        if ('error' in joinResponse) {
            throw redirect({ to: '/parce/not-found' });
        }
        const roomInformation = getAllRoomInfo({ data: params.roomId });
        return {
            room: roomInformation,
            member: joinResponse.member,
            guestUuid: ('generatedUuid' in joinResponse ? joinResponse.generatedUuid : undefined)
        }
    },
    component: RouteComponent,
})

function RouteComponent() {
    const { room, member, guestUuid } = Route.useLoaderData();

    if (guestUuid) {
        // handle this 
    }


}
