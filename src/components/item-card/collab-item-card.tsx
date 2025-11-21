// components/item-card/collab-item-card.tsx
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BaseReceiptItemCard } from "./base-receipt-item-card";
import { QuantityControl } from "./quantity-control";
import { useDebouncedClaim } from "@/hooks/use-debounced-claim";
import { ItemWithClaims } from "@/hooks/useClaims";

export function CollabItemCard({
    data,
    roomId,
    memberId,
}: {
    data: ItemWithClaims,
    roomId: string;
    memberId: string;
}) {
    const { item, myClaim, otherClaims, otherClaimedQty } = data;

    const { quantity, updateQuantity } = useDebouncedClaim(
        myClaim?.quantity ?? 0,
        roomId,
        memberId,
        item.id
    );

    const isMine = quantity > 0;
    const remaining = item.quantity - otherClaimedQty - quantity;

    const isFullyClaimed = remaining <= 0;
    const isDimmed = isFullyClaimed && !isMine;

    return (
        <BaseReceiptItemCard
            item={item}
            variant={isMine ? "active" : isDimmed ? "dimmed" : "default"}
            onClick={() => {
                // Only allow click-to-toggle for single items
                // For multi-items, they must use the stepper controls
                if (item.quantity === 1) {
                    // Prevent toggling if fully claimed by others
                    if (!isMine && isFullyClaimed) return;
                    updateQuantity(isMine ? 0 : 1);
                }
            }}

            // CHANGE: Cleaner Avatar Display
            rightElement={
                otherClaims.length > 0 && (
                    <div className="flex items-center gap-1">
                        {otherClaims.slice(0, 3).map(claim => (
                            <div key={claim.memberId} className="relative">
                                <Avatar className="h-8 w-8 border-2 border-background ring-1 ring-muted/50">
                                    <AvatarFallback className="text-[10px] font-bold bg-muted text-muted-foreground">
                                        {claim.displayName.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
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
                (item.quantity > 1) && (
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
