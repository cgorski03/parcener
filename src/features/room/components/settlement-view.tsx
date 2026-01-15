import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useGetRoomPulse } from '../hooks/use-room';
import { SettlementWarning } from './settlement-warning';
import { SettlementPaymentCard } from './settlement-payment-card';
import type { RoomMembership } from '@/shared/dto/types';
import type { BreakdownItem } from '@/shared/components/price-breakdown';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { AppHeader } from '@/shared/components/layout/app-header';
import { PriceBreakdown } from '@/shared/components/price-breakdown';
import { useSettlementCalculation } from '@/features/receipt-review/hooks/use-receipt-settlement';
import { ReceiptLayoutShell } from '@/shared/components/layout/receipt-layout-shell';
import { moneyValuesEqual } from '@/shared/lib/money-math';

interface SettlementViewProps {
  roomId: string;
  currentMember: RoomMembership;
  onBack: () => void;
}

export function SettlementView({
  roomId,
  currentMember,
  onBack,
}: SettlementViewProps) {
  const { data: room, isLoading } = useGetRoomPulse(roomId);

  if (isLoading) {
    return <SettlementLoadingSkeleton />;
  }

  if (!room) {
    return <div>Room not found.</div>;
  }

  // 2. These are now safe because 'room' is guaranteed to exist
  const settlements = useSettlementCalculation(room);
  const mySettlement = settlements.find(
    (s) => s.userId === currentMember.roomMemberId,
  );
  const others = settlements.filter(
    (s) => s.userId !== currentMember.roomMemberId,
  );

  const isHost = room.createdBy === currentMember.userId;

  const calculatedTotal = settlements.reduce((acc, s) => acc + s.totalOwed, 0);
  const valuesMatch = moneyValuesEqual(
    room.receipt.grandTotal,
    calculatedTotal,
  );

  const myBreakdownItems: Array<BreakdownItem> = useMemo(() => {
    if (!mySettlement) return [];
    return mySettlement.claimedItems.map(
      ({ claimId, item, quantityClaimed }) => ({
        id: claimId,
        name: item.interpretedText,
        price: item.price / item.quantity,
        quantity: quantityClaimed,
      }),
    );
  }, [mySettlement]);

  return (
    <ReceiptLayoutShell
      header={
        <AppHeader
          left={
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="-ml-2"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          }
          title="Settlement"
        />
      }
    >
      {/* 1. Payment Action Section */}
      <div className="mb-6">
        {mySettlement && (
          <SettlementPaymentCard
            roomId={roomId}
            isHost={isHost}
            myTotalOwed={mySettlement.totalOwed}
          />
        )}
      </div>

      {/* 2. My Breakdown */}
      {mySettlement && (
        <PriceBreakdown
          label="Your Share"
          subtotal={mySettlement.subtotal}
          tax={mySettlement.taxShare}
          tip={mySettlement.tipShare}
          grandTotal={mySettlement.totalOwed}
          items={myBreakdownItems}
        />
      )}

      {!valuesMatch && (
        <SettlementWarning
          discrepancy={room.receipt.grandTotal - calculatedTotal}
          className="mb-4"
        />
      )}

      {/* 3. List of Everyone Else */}
      <div className="space-y-3 pt-4 pb-10">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-medium text-muted-foreground">
            Room Members
          </h3>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
            {others.length}
          </span>
        </div>

        {others.map((person) => (
          <div
            key={person.userId}
            className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border">
                <AvatarImage src={person.avatarUrl || undefined} />
                <AvatarFallback>{person.displayName[0] || '?'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{person.displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {person.claimedItemsCount} items
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm">
                ${person.totalOwed.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                ${person.subtotal.toFixed(2)} + fees
              </p>
            </div>
          </div>
        ))}
      </div>
    </ReceiptLayoutShell>
  );
}

function SettlementLoadingSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-10 w-1/3 bg-muted rounded" />
      <div className="h-32 w-full bg-muted rounded" />
      <div className="h-64 w-full bg-muted rounded" />
    </div>
  );
}
