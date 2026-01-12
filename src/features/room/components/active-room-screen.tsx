import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Wrench } from 'lucide-react';
import { useGetRoomPulse } from '../hooks/use-room';
import { useEnrichedClaimItems } from '../hooks/use-claims';
import { SettlementView } from './settlement-view';
import type { FullRoomInfoDto, RoomMembership } from '@/shared/dto/types';
import { Route } from '@/routes/receipt/parce/$roomId';
import { ReceiptLayoutShell } from '@/shared/components/layout/receipt-layout-shell';
import { CollaborativeRoomHeader } from '@/shared/components/layout/collaborative-room-header';
import { CollabItemCard } from '@/shared/components/item-card/collab-item-card';
import { PriceBreakdown } from '@/shared/components/price-breakdown';
import { Button } from '@/shared/components/ui/button';

export function ActiveRoomScreen({
  initialRoom,
  member,
}: {
  initialRoom: FullRoomInfoDto;
  member: RoomMembership;
}) {
  const { data: room } = useGetRoomPulse(initialRoom.roomId, initialRoom);
  const { itemsWithClaims } = useEnrichedClaimItems(room, member);
  const { view } = Route.useSearch();
  const navigate = useNavigate();

  const setView = (newView: 'items' | 'settlement') => {
    navigate({
      to: '.',
      search: (old) => ({ ...old, view: newView }),
    });
  };

  useEffect(() => {
    if (member.guestUuid && !member.userId) {
      const cookieName = `guest_uuid_room_${room.roomId}`;
      const maxAge = 60 * 60 * 24 * 7;
      document.cookie = `${cookieName}=${member.guestUuid}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
  }, [member.guestUuid, room.roomId]);

  const isHost = useMemo(
    () => room.createdBy === member.userId,
    [room.createdBy, member.userId],
  );
  const getReceiptErrorMessage = () => {
    if (room.receiptIsValid) {
      return undefined;
    }
    if (isHost) {
      return 'Fix total mismatch in order to allow settling the bill';
    }
    return 'Host must fix subtotal mismatch before settling';
  };

  if (view === 'settlement') {
    return (
      <SettlementView
        roomId={room.roomId}
        currentMember={member}
        onBack={() => setView('items')}
      />
    );
  }

  return (
    <ReceiptLayoutShell
      header={
        <CollaborativeRoomHeader
          isHost={isHost}
          receiptId={room.receiptId}
          title={room.title ?? 'Untitled'}
          members={room.members}
          activeFilterId={null}
          onSelectFilter={() => console.log('filter pressed')}
        />
      }
    >
      {itemsWithClaims.map((data) => (
        <CollabItemCard
          key={data.item.receiptItemId}
          data={data}
          roomId={room.roomId}
          memberId={member.roomMemberId}
        />
      ))}
      <PriceBreakdown
        subtotal={room.receipt.subtotal}
        tax={room.receipt.tax}
        tip={room.receipt.tip}
        grandTotal={room.receipt.grandTotal}
        label="Receipt Totals"
        className="mt-6"
        errorMessage={getReceiptErrorMessage()}
        actionButton={
          !room.receiptIsValid && isHost ? (
            <Link
              to="/receipt/review/$receiptId"
              params={{ receiptId: room.receiptId }}
            >
              <Button className="w-full h-11">
                <Wrench className="h-4 w-4 mr-2" />
                Resolve Total Mismatch
              </Button>
            </Link>
          ) : (
            <Button
              className="w-full mt-2"
              onClick={() => setView('settlement')}
              variant="secondary"
            >
              View Settlement & Pay
            </Button>
          )
        }
      />
    </ReceiptLayoutShell>
  );
}
