import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BaseReceiptItemCard } from "./base-receipt-item-card";
import { ItemWithClaims } from "@/routes/parce/$roomId";

export function CollabItemCard({
    data,
    onUpdateClaim
}: {
    data: ItemWithClaims,
    onUpdateClaim: (qty: number) => void
}) {
    const { item, myClaim, otherClaims, remainingQuantity } = data;

    const myQty = myClaim?.quantity ?? 0;
    const isMine = myQty > 0;
    const isFullyClaimedByOthers = remainingQuantity <= 0 && !isMine;

    return (
        <BaseReceiptItemCard
            item={item}
            variant={isMine ? "active" : isFullyClaimedByOthers ? "dimmed" : "default"}
            onClick={() => {
                if (item.quantity === 1) {
                    onUpdateClaim(isMine ? 0 : 1);
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
        // footerElement={
        //     (item.quantity > 1 && isMine) && (
        //         <QuantityControl
        //             totalQuantity={item.quantity}
        //             myQuantity={myQty}
        //             remainingQuantity={remainingQuantity}
        //             onIncrement={() => onUpdateClaim(myQty + 1)}
        //             onDecrement={() => onUpdateClaim(myQty - 1)}
        //             onOpenSplitSheet={() => { }}
        //         />
        //     )
        // }
        />
    );
}
