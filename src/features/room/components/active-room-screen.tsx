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
import {
  ReceiptPaper,
  ReceiptPaperSectionBreak,
} from '@/shared/components/receipt-paper';
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
      <ReceiptPaper>
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
        <ReceiptPaperSectionBreak>
          <PriceBreakdown
            subtotal={room.receipt.subtotal}
            tax={room.receipt.tax}
            tip={room.receipt.tip}
            grandTotal={room.receipt.grandTotal}
            label="Receipt Totals"
            className="rounded-none border-0 bg-transparent p-6 shadow-none"
            errorMessage={getReceiptErrorMessage(room.receiptIsValid, isHost)}
            metadataText={receiptMeta}
          />
        </ReceiptPaperSectionBreak>
      </ReceiptPaper>
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
