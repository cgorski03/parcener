import { useGetRoomPulse } from '@/hooks/useRoom'
import { RoomMemberSelect } from '@/server/db'
import { useEffect } from 'react'
import { ReceiptLayoutShell } from '../layout/receipt-layout-shell'
import { CollaborativeRoomHeader } from '../layout/collaborative-room-header'
import { useEnrichedClaimItems } from '@/hooks/useClaims'
import { CollabItemCard } from '../item-card/collab-item-card'
import { PriceBreakdown } from '../price-breakdown'
import { FullRoomInfoDto } from '@/server/dtos'

export function ActiveRoomScreen({
    initialRoom,
    member,
}: {
    initialRoom: FullRoomInfoDto
    member: RoomMemberSelect
}) {
    const { data: room } = useGetRoomPulse(initialRoom)
    const { itemsWithClaims } = useEnrichedClaimItems(room, member)

    useEffect(() => {
        if (member.guestUuid && !member.userId) {
            const cookieName = `guest_uuid_room_${room.id}`
            const maxAge = 60 * 60 * 24 * 7
            document.cookie = `${cookieName}=${member.guestUuid}; path=/; max-age=${maxAge}; SameSite=Lax`
        }
    }, [member.guestUuid, room.id])

    return (
        <ReceiptLayoutShell
            header={
                <CollaborativeRoomHeader
                    roomId={room.id}
                    roomName={room.title ?? 'Untitled'}
                    members={room.members}
                    activeFilterId={null}
                    onSelectFilter={() => console.log('filter pressed')}
                />
            }
        >
            {itemsWithClaims &&
                itemsWithClaims.map((data) => (
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
    )
}
