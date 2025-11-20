import { getAllRoomInfo, joinRoomRpc } from '@/server/room/room-rpc'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react';

export const Route = createFileRoute('/parce/$roomId')({
    loader: async ({ params }) => {
        const joinResponse = await joinRoomRpc({ data: params.roomId });
        if ('error' in joinResponse) {
            throw redirect({ to: '/parce/not-found' });
        }
        const roomInformation = await getAllRoomInfo({ data: params.roomId });
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
    const router = useRouter();
    if (!room) {
        throw router.navigate({ to: '/parce/not-found' });
    }
    useEffect(() => {
        if (guestUuid) {
            const cookieName = `guest_uuid_room_${room.id}`;
            const maxAge = 60 * 60 * 24 * 7;
            document.cookie = `${cookieName}=${guestUuid}; path=/; max-age=${maxAge}; SameSite=Lax`;
        }
    }, [guestUuid, room.id]);

    return (
        <div>
            {/* Header component that will show your personal total*/}
            {/* Current Room Members Selector
        * This will allow you to click on someone else's profile in the room, and see what they have selected
        */}
            {/*We will have the list of unclaimed items*/}
            {/*List of YOUR claimed items below this*/}
            {JSON.stringify(room)}
        </div>
    )

}
