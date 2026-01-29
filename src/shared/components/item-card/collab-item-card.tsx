import { BaseReceiptItemCard } from './base-receipt-item-card';
import { QuantityControl } from './quantity-control';
import type { ItemWithClaims } from '@/features/room/hooks/use-claims';
import { RoomMemberAvatar } from '@/features/room/components/room-member-avatar';
import { useDebouncedClaim } from '@/features/room/hooks/use-debounced-claim';

export function CollabItemCard({
  data,
  roomId,
  memberId,
  disabled = false,
}: {
  data: ItemWithClaims;
  roomId: string;
  memberId: string;
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
      rightElement={
        otherClaims.length > 0 && (
          <div className="flex items-center gap-1">
            {otherClaims.slice(0, 3).map((claim) => (
              <div key={claim.memberId} className="relative">
                <RoomMemberAvatar
                  id={claim.memberId}
                  avatarUrl={claim.avatarUrl}
                  displayName={claim.displayName}
                />
                {/* Show count badge if they took more than 1 */}
                {claim.quantity > 1 && (
                  <div className="absolute -bottom-1 -right-1 bg-background text-[9px] font-bold border rounded-full h-4 w-4 flex items-center justify-center shadow-sm">
                    {claim.quantity}
                  </div>
                )}
              </div>
            ))}
            {otherClaims.length > 3 && (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium border-2 border-background">
                +{otherClaims.length - 3}
              </div>
            )}
          </div>
        )
      }
      // Render Quantity Controls
      footerElement={
        item.quantity > 1 &&
        !disabled && (
          <QuantityControl
            totalQuantity={item.quantity}
            myQuantity={quantity}
            othersQuantity={otherClaimedQty}
            onIncrement={() => updateQuantity(quantity + 1)}
            onDecrement={() => updateQuantity(quantity - 1)}
          />
        )
      }
    />
  );
}
