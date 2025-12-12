import { useGetRoomPulse } from '@/hooks/use-room'
import { useEffect, useMemo } from 'react'
import { ReceiptLayoutShell } from '../layout/receipt-layout-shell'
import { CollaborativeRoomHeader } from '../layout/collaborative-room-header'
import { useEnrichedClaimItems } from '@/hooks/use-claims'
import { CollabItemCard } from '../item-card/collab-item-card'
import { PriceBreakdown } from '../price-breakdown'
import { FullRoomInfoDto, RoomMembership } from '@/server/dtos'

export function ActiveRoomScreen({
    initialRoom,
    member,
}: {
    initialRoom: FullRoomInfoDto
    member: RoomMembership
}) {
    const { data: room } = useGetRoomPulse(initialRoom)
    const { itemsWithClaims } = useEnrichedClaimItems(room, member)

    useEffect(() => {
        if (member.guestUuid && !member.userId) {
            const cookieName = `guest_uuid_room_${room.roomId}`
            const maxAge = 60 * 60 * 24 * 7
            document.cookie = `${cookieName}=${member.guestUuid}; path=/; max-age=${maxAge}; SameSite=Lax`
        }
    }, [member.guestUuid, room.roomId])

    const isHost = useMemo(() => room.createdBy === member.userId, [room.createdBy, member.userId]);


    return (
        <ReceiptLayoutShell
            header={
                <CollaborativeRoomHeader
                    roomId={room.roomId}
                    isHost={isHost}
                    receiptId={room.receiptId}
                    title={room.title ?? 'Untitled'}
                    members={room.members}
                    activeFilterId={null}
                    onSelectFilter={() => console.log('filter pressed')}
                />
            }
        >
            {itemsWithClaims &&
                itemsWithClaims.map((data) => (
                    <CollabItemCard
                        key={data.item.receiptItemId}
                        data={data}
                        roomId={room.roomId}
                        memberId={member.roomMemberId}
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
    )
}
