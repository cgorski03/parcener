import { useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Wrench } from 'lucide-react';
import { useCurrentRoomContext } from '../hooks/use-current-room-context';
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

function formatReceiptDate(date: Date | null) {
  if (!date) return 'NO-DATE';
  return new Date(date).toISOString().slice(0, 10);
}

const getReceiptErrorMessage = (isValid: boolean, isHost: boolean) => {
  if (isValid) {
    return undefined;
  }
  if (isHost) {
    return 'Fix total mismatch in order to allow settling the bill';
  }
  return 'Host must fix subtotal mismatch before settling';
};

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
  const { currentMember, isHost } = useCurrentRoomContext(room, member);

  useEffect(() => {
    if (member.guestUuid && !member.userId) {
      const cookieName = `guest_uuid_room_${room.roomId}`;
      const maxAge = 60 * 60 * 24 * 7;
      document.cookie = `${cookieName}=${member.guestUuid}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
  }, [member.guestUuid, member.userId, room.roomId]);

  const setView = (newView: 'items' | 'settlement') => {
    navigate({
      to: '.',
      search: (old) => ({ ...old, view: newView }),
    });
  };

  const isLocked = room.status === 'locked';
  const receiptDate = formatReceiptDate(room.receipt.createdAt);
  const receiptMeta = `AUTH: ${room.roomId.slice(0, 4).toUpperCase()} - ${receiptDate} - PARCENER`;

  if (view === 'settlement') {
    return (
      <SettlementView
        initialRoom={room}
        currentMember={member}
        onBack={() => setView('items')}
      />
    );
  }

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
          status={room.status}
          onSelectFilter={() => console.log('filter pressed')}
        />
      }
    >
      <div className="relative">
        <div className="receipt-paper-edge absolute inset-x-px top-px z-10 rotate-180" />
        <div className="receipt-paper-edge absolute inset-x-px bottom-px z-10" />
        <div className="relative overflow-hidden rounded-sm border border-border/70 bg-background">
          {itemsWithClaims.map((data) => (
            <CollabItemCard
              key={data.item.receiptItemId}
              data={data}
              roomId={room.roomId}
              memberId={member.roomMemberId}
              currentMember={currentMember}
              disabled={isLocked}
            />
          ))}
          <div className="relative border-t border-dashed border-border/70">
            <div className="pointer-events-none absolute -left-3 -top-3 h-6 w-6 rounded-full border border-border/70 bg-muted" />
            <div className="pointer-events-none absolute -right-3 -top-3 h-6 w-6 rounded-full border border-border/70 bg-muted" />
            <PriceBreakdown
              subtotal={room.receipt.subtotal}
              tax={room.receipt.tax}
              tip={room.receipt.tip}
              grandTotal={room.receipt.grandTotal}
              label="Receipt Totals"
              className="rounded-none border-0 bg-transparent px-4 py-4 shadow-none"
              errorMessage={getReceiptErrorMessage(room.receiptIsValid, isHost)}
              metadataText={receiptMeta}
            />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-2xl px-4 pt-4 pb-6">
        {!room.receiptIsValid && isHost ? (
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
            className="w-full h-11"
            onClick={() => setView('settlement')}
            variant="secondary"
          >
            View Settlement & Pay
          </Button>
        )}
      </div>
    </ReceiptLayoutShell>
  );
}
