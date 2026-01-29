import { useMemo } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { useGetRoomPulse, useLockRoom } from '../hooks/use-room';
import { useEnrichedClaimItems } from '../hooks/use-claims';
import { SettlementWarning } from './settlement-warning';
import { SettlementPaymentCard } from './settlement-payment-card';
import { SettlementMembersList } from './settlement-members-list';
import type { FullRoomInfoDto, RoomMembership } from '@/shared/dto/types';
import type { BreakdownItem } from '@/shared/components/price-breakdown';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { AppHeader } from '@/shared/components/layout/app-header';
import { PriceBreakdown } from '@/shared/components/price-breakdown';
import { ReceiptLayoutShell } from '@/shared/components/layout/receipt-layout-shell';
import { useSettlementCalculation } from '@/features/receipt-review/hooks/use-receipt-settlement';

interface SettlementViewProps {
  initialRoom: FullRoomInfoDto;
  currentMember: RoomMembership;
  onBack: () => void;
}

export function SettlementView({
  initialRoom,
  currentMember,
  onBack,
}: SettlementViewProps) {
  const { data: room } = useGetRoomPulse(initialRoom.roomId, initialRoom);
  const { allItemsClaimed, claimProgress, unclaimedAmount } =
    useEnrichedClaimItems(room, currentMember);
  const { mutate: lockRoom, isPending: isLocking } = useLockRoom(room.roomId);
  const settlements = useSettlementCalculation(room);

  const mySettlement = settlements.find(
    (s) => s.userId === currentMember.roomMemberId,
  );
  const others = settlements.filter(
    (s) => s.userId !== currentMember.roomMemberId,
  );

  const isHost = room.createdBy === currentMember.userId;
  const isLocked = room.status === 'locked';

  const myItems: Array<BreakdownItem> = useMemo(() => {
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
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Items Claimed
          </span>
          <span className="text-xs font-medium tabular-nums">
            {Math.round(claimProgress)}%
          </span>
        </div>
        <Progress value={claimProgress} className="h-1.5" />
      </div>

      {/* Payment Card */}
      {mySettlement && (
        <div className="mb-5">
          <SettlementPaymentCard
            roomId={room.roomId}
            isHost={isHost}
            myTotalOwed={mySettlement.totalOwed}
          />
        </div>
      )}

      {/* Your Share */}
      {mySettlement && (
        <div className="mb-5">
          <PriceBreakdown
            label="Your Share"
            subtotal={mySettlement.subtotal}
            tax={mySettlement.taxShare}
            tip={mySettlement.tipShare}
            grandTotal={mySettlement.totalOwed}
            items={myItems}
            className="border-primary/20 bg-primary/[0.02]"
          />
        </div>
      )}

      {/* Warning */}
      {!allItemsClaimed && (
        <SettlementWarning discrepancy={unclaimedAmount} className="mb-5" />
      )}

      {/* Other Members */}
      <div className="pb-6">
        <SettlementMembersList members={others} />
      </div>

      {/* Lock CTA */}
      {isHost && allItemsClaimed && !isLocked && (
        <div className="pb-6">
          <Button
            onClick={() => lockRoom()}
            disabled={isLocking}
            className="w-full"
          >
            <Lock className="mr-2 h-4 w-4" />
            {isLocking ? 'Locking...' : 'Lock Room'}
          </Button>
        </div>
      )}
    </ReceiptLayoutShell>
  );
}
