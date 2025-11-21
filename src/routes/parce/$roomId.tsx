import { CollabItemCard } from '@/components/item-card/collab-item-card';
import { CollaborativeRoomHeader } from '@/components/layout/collaborative-room-header';
import { ReceiptLayoutShell } from '@/components/layout/receipt-layout-shell';
import { useClaimItem } from '@/hooks/useClaims';
import { useGetRoomPulse } from '@/hooks/useRoom';
import { ReceiptItemDto } from '@/server/dtos';
import { getAllRoomInfoRpc, joinRoomRpc } from '@/server/room/room-rpc'
import { createFileRoute, notFound, } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react';

type EnrichedClaim = {
    quantity: number;
    memberId: string;
    displayName: string;
    isMe: boolean;
};

export type ItemWithClaims = {
    item: ReceiptItemDto;
    myClaim: EnrichedClaim | undefined;
    otherClaims: EnrichedClaim[];
    totalClaimed: number;
    remainingQuantity: number;
}

export const Route = createFileRoute('/parce/$roomId')({
    loader: async ({ params }) => {
        const joinResponse = await joinRoomRpc({ data: params.roomId });
        if ('error' in joinResponse) {
            throw notFound();
        }
        const roomInformation = await getAllRoomInfoRpc({ data: params.roomId });
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

    if (!initialRoomData || initialRoomData.receipt == null) {
        throw notFound();
    }
    const { mutateAsync: claimItem, isPending: claimItemLoading } = useClaimItem();
    const { data: room } = useGetRoomPulse(initialRoomData.id, initialRoomData);

    useEffect(() => {
        if (guestUuid) {
            const cookieName = `guest_uuid_room_${room.id}`;
            const maxAge = 60 * 60 * 24 * 7;
            document.cookie = `${cookieName}=${guestUuid}; path=/; max-age=${maxAge}; SameSite=Lax`;
        }
    }, [guestUuid, room.id]);
    //
    // TODO lift into custom hook
    const currentClaims = room.claims;
    const memberMap = useMemo(() => {
        return new Map(room.members.map(m => [m.id, m]));

    }, [room.members])
    const itemsWithClaims = useMemo(() => {
        const claimsByItem = new Map<string, EnrichedClaim[]>();
        currentClaims.forEach(claim => {
            const memberInfo = memberMap.get(claim.memberId);
            const enriched: EnrichedClaim = {
                quantity: parseFloat(claim.quantity),
                memberId: claim.memberId,
                displayName: memberInfo?.displayName ?? 'Unknown',
                isMe: claim.memberId === member.id,
            }
            const existingClaims = claimsByItem.get(claim.receiptItemId) || [];
            existingClaims.push(enriched);
            claimsByItem.set(claim.receiptItemId, existingClaims);
        })
        return room.receipt?.items.map(item => {
            const claims = claimsByItem.get(item.id) || [];
            const myClaim = claims.find(c => c.isMe);
            const otherClaims = claims.filter(c => !c.isMe);

            const totalClaimedQty = claims.reduce((sum, c) => sum + c.quantity, 0);

            return {
                item,
                myClaim,
                otherClaims,
                totalClaimed: totalClaimedQty,
                remainingQuantity: item.quantity - totalClaimedQty
            };
        });
    }, [room.receipt.items, currentClaims, memberMap, member.id]);


    return (
        <ReceiptLayoutShell header={
            <CollaborativeRoomHeader
                roomId={room.id}
                roomName={room.title ?? "Untitled"}
                members={room.members}
                activeFilterId={null} onSelectFilter={() => (console.log("filter pressed"))} />}>

            {itemsWithClaims && itemsWithClaims.map((data) => (
                <CollabItemCard
                    key={data.item.id}
                    data={data} // Pass the pre-calculated object
                    onUpdateClaim={(newQty) => { claimItem({ roomId: room.id, receiptItemId: data.item.id, quantity: newQty }) }}
                />
            ))}
        </ReceiptLayoutShell>
    );

}
