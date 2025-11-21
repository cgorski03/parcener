import { CollabItemCard } from '@/components/item-card/collab-item-card';
import { CollaborativeRoomHeader } from '@/components/layout/collaborative-room-header';
import { ReceiptLayoutShell } from '@/components/layout/receipt-layout-shell';
import { PriceBreakdown } from '@/components/price-breakdown';
import { useClaimItem, useEnrichedClaimItems } from '@/hooks/useClaims';
import { useGetRoomPulse } from '@/hooks/useRoom';
import { getAllRoomInfoRpc, joinRoomRpc } from '@/server/room/room-rpc'
import { createFileRoute, notFound, } from '@tanstack/react-router'
import { useEffect } from 'react';


export const Route = createFileRoute('/parce/$roomId')({
    loader: async ({ params }) => {
        const joinResponse = await joinRoomRpc({ data: params.roomId });
        if ('error' in joinResponse) {
            throw notFound();
        }
        const roomInformation = await getAllRoomInfoRpc({ data: { roomId: params.roomId } });
        return {
            room: roomInformation,
            member: joinResponse.member,
            guestUuid: ('generatedUuid' in joinResponse ? joinResponse.generatedUuid : undefined)
        }
    },
    component: RouteComponent,
})

function RouteComponent() {
    const { room: initialRoomData, member, guestUuid } = Route.useLoaderData();

    if (!initialRoomData || initialRoomData.data == null) {
        throw notFound();
    }

    const { data: room } = useGetRoomPulse(initialRoomData.data.id, initialRoomData.data);

    if (room.receipt == null) {
        throw notFound();
    }

    const { itemsWithClaims } = useEnrichedClaimItems(room, member);


    useEffect(() => {
        if (guestUuid) {
            const cookieName = `guest_uuid_room_${room.id}`;
            const maxAge = 60 * 60 * 24 * 7;
            document.cookie = `${cookieName}=${guestUuid}; path=/; max-age=${maxAge}; SameSite=Lax`;
        }
    }, [guestUuid, room.id]);

    return (
        <ReceiptLayoutShell header={
            <CollaborativeRoomHeader
                roomId={room.id}
                roomName={room.title ?? "Untitled"}
                members={room.members}
                activeFilterId={null}
                onSelectFilter={() => (console.log("filter pressed"))} />}>

            {itemsWithClaims && itemsWithClaims.map((data) => (
                <CollabItemCard
                    key={data.item.id}
                    data={data}
                    roomId={room.id}
                    memberId={member.id}
                />
            ))}
            <PriceBreakdown
                subtotal={room.receipt.subtotal}
                tax={room.receipt.tax ?? 0}
                tip={room.receipt.tip ?? 0}
                grandTotal={room.receipt.grandTotal ?? 0}
                label="Receipt Totals"
                className="mt-6"
            />

        </ReceiptLayoutShell>
    );

}
