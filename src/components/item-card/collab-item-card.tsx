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
    const isFullyClaimedByOthers = item.quantity - otherClaimedQty + quantity <= 0 && !isMine;

    return (
        <BaseReceiptItemCard
            item={item}
            variant={isMine ? "active" : isFullyClaimedByOthers ? "dimmed" : "default"}
            onClick={() => {
                if (item.quantity === 1) {
                    updateQuantity(isMine ? 0 : 1);
                }
            }}

            // Render Avatars of others
            rightElement={
                otherClaims.length > 0 && (
                    <div className="flex -space-x-2">
                        {otherClaims.map(claim => (
                            <Avatar key={claim.memberId} className="h-6 w-6 border-2 border-background">
                                <AvatarFallback className="text-[9px]">
                                    {claim.displayName.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        ))}
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
