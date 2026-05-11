import { useRef } from 'react';
import { BaseReceiptItemCard } from './base-receipt-item-card';
import { ClaimQuantityControl } from './claim-quantity-control';
import type {
  EnrichedClaim,
  ItemWithClaims,
} from '@/features/room/hooks/use-claims';
import type { RoomMemberDto } from '@/shared/dto/types';
import { RoomMemberAvatar } from '@/features/room/components/room-member-avatar';
import { useDebouncedClaim } from '@/features/room/hooks/use-debounced-claim';

export function CollabItemCard({
  data,
  roomId,
  memberId,
  currentMember,
  disabled = false,
}: {
  data: ItemWithClaims;
  roomId: string;
  memberId: string;
  currentMember: RoomMemberDto;
  disabled?: boolean;
}) {
  const { item, myClaim, otherClaims, otherClaimedQty } = data;

  const { quantity, updateQuantity } = useDebouncedClaim(
    myClaim?.quantity ?? 0,
    roomId,
    memberId,
    item.receiptItemId,
  );

  const isMine = quantity > 0;
  const remaining = item.quantity - otherClaimedQty - quantity;

  const isFullyClaimed = remaining <= 0;
  const isDimmed = (isFullyClaimed && !isMine) || disabled;
  const optimisticClaimedAtRef = useRef<Date>(new Date());
  const liveMyClaim: EnrichedClaim | null =
    myClaim || quantity > 0
      ? {
          memberId,
          avatarUrl: currentMember.avatarUrl,
          displayName: currentMember.displayName ?? memberId,
          quantity,
          claimedAt: myClaim?.claimedAt ?? optimisticClaimedAtRef.current,
          isMe: true,
        }
      : null;

  return (
    <BaseReceiptItemCard
      item={item}
      variant={isMine ? 'active' : isDimmed ? 'dimmed' : 'default'}
      onClick={() => {
        if (disabled) return;
        // Only allow click-to-toggle for single items
        // For multi-items, they must use the stepper controls
        if (item.quantity === 1) {
          // Prevent toggling if fully claimed by others
          if (!isMine && isFullyClaimed) return;
          updateQuantity(isMine ? 0 : 1);
        }
      }}
      prefixElement={
        item.quantity === 1 ? (
          isMine && liveMyClaim ? (
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-muted-foreground/35 bg-background overflow-hidden">
              <RoomMemberAvatar
                id={liveMyClaim.memberId}
                avatarUrl={liveMyClaim.avatarUrl}
                displayName={liveMyClaim.displayName}
                size="xs"
              />
            </div>
          ) : otherClaims.length > 0 ? (
            <div className="flex items-center gap-1">
              {otherClaims.slice(0, 3).map((claim) => (
                <div key={claim.memberId} className="relative">
                  <RoomMemberAvatar
                    id={claim.memberId}
                    avatarUrl={claim.avatarUrl}
                    displayName={claim.displayName}
                    size="xs"
                  />
                </div>
              ))}
              {otherClaims.length > 3 && (
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium border-2 border-background">
                  +{otherClaims.length - 3}
                </div>
              )}
            </div>
          ) : (
            <div className="h-8 w-8 rounded-full border border-muted-foreground/30 bg-background" />
          )
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-muted-foreground/35 bg-background font-mono text-sm font-semibold text-muted-foreground">
            {item.quantity}x
          </div>
        )
      }
      // Render Quantity Controls
      footerElement={
        item.quantity > 1 &&
        !disabled && (
          <ClaimQuantityControl
            totalQuantity={item.quantity}
            myQuantity={quantity}
            othersQuantity={otherClaimedQty}
            myClaim={liveMyClaim}
            otherClaims={otherClaims}
            onPunchTap={(delta) => {
              updateQuantity(Math.max(0, quantity + delta));
            }}
            onIncrement={() => updateQuantity(quantity + 1)}
            onDecrement={() => updateQuantity(quantity - 1)}
          />
        )
      }
    />
  );
}
