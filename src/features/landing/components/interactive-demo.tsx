import { useState } from 'react';
import { Receipt } from 'lucide-react';
import type { ReceiptItemDto } from '@/shared/dto/types';
import { BaseReceiptItemCard } from '@/shared/components/item-card/base-receipt-item-card';
import { PriceBreakdown } from '@/shared/components/price-breakdown';
import { ClaimQuantityControl } from '@/shared/components/item-card/claim-quantity-control';
import { RoomMemberAvatar } from '@/features/room/components/room-member-avatar';
import type { EnrichedClaim } from '@/features/room/hooks/use-claims';
import { ReceiptPaper } from '@/shared/components/receipt-paper';

// --- Mock Data Types ---
type MockClaim = EnrichedClaim;

const myDemoClaimBase = {
  memberId: '1',
  displayName: 'You',
  avatarUrl: null,
  isMe: true,
  claimedAt: new Date('2026-05-10T12:00:00Z'),
};

// --- Demo Component Wrapper ---
// Mimics your real CollabItemCard but uses local state instead of hooks
function DemoCollabItemCard({
  item,
  myQty,
  others,
  onUpdate,
}: {
  item: ReceiptItemDto;
  myQty: number;
  others: Array<MockClaim>;
  onUpdate: (newQty: number) => void;
}) {
  const otherClaimedQty = others.reduce((acc, curr) => acc + curr.quantity, 0);
  const isMine = myQty > 0;
  const remaining = item.quantity - otherClaimedQty - myQty;
  const isFullyClaimed = remaining <= 0;
  const myClaim: EnrichedClaim | null =
    myQty > 0
      ? {
          ...myDemoClaimBase,
          quantity: myQty,
        }
      : null;

  // Logic: Dim if fully claimed by others and I have none
  const isDimmed = isFullyClaimed && !isMine;
  const singleItemOwner = myClaim ?? others[0];

  return (
    <BaseReceiptItemCard
      item={item}
      variant={isMine ? 'active' : isDimmed ? 'dimmed' : 'default'}
      prefixElement={
        item.quantity === 1 ? (
          singleItemOwner ? (
            <RoomMemberAvatar
              id={singleItemOwner.memberId}
              avatarUrl={singleItemOwner.avatarUrl}
              displayName={singleItemOwner.displayName}
              size="sm"
            />
          ) : (
            <div className="h-8 w-8 rounded-full border border-muted-foreground/30 bg-background" />
          )
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-muted-foreground/30 bg-background font-mono text-sm font-semibold text-muted-foreground">
            {item.quantity}x
          </div>
        )
      }
      onClick={() => {
        // Click-to-toggle logic for single items
        if (item.quantity === 1) {
          if (!isMine && isFullyClaimed) return;
          onUpdate(isMine ? 0 : 1);
        }
      }}
      footerElement={
        item.quantity > 1 && (
          <ClaimQuantityControl
            totalQuantity={item.quantity}
            myQuantity={myQty}
            othersQuantity={otherClaimedQty}
            myClaim={myClaim}
            otherClaims={others}
            onIncrement={() => onUpdate(myQty + 1)}
            onDecrement={() => onUpdate(myQty - 1)}
            onPunchTap={(delta) => onUpdate(myQty + delta)}
          />
        )
      }
    />
  );
}

export function InteractiveDemo() {
  // 1. Setup Items
  const demoItems: Array<ReceiptItemDto> = [
    {
      receiptItemId: '1',
      quantity: 1,
      interpretedText: 'Truffle Fries',
      price: 12.0,
      rawText: 'TRFFL FRY',
    },
    {
      receiptItemId: '2',
      quantity: 4,
      interpretedText: 'Spicy Margarita',
      price: 56.0,
      rawText: '4 SPCY MARG',
    }, // 4 @ $14ea
    {
      receiptItemId: '3',
      quantity: 1,
      interpretedText: 'Wagyu Slider',
      price: 18.5,
      rawText: 'WGY SLDR',
    },
  ];

  // Calculate Receipt Grand Total (Subtotal + 28% tax/tip assumption) for the header
  const receiptSubtotal = demoItems.reduce((acc, i) => acc + i.price, 0);
  const receiptGrandTotal = receiptSubtotal * 1.28;

  // 2. Setup "My" State (Local Map: ItemId -> Quantity)
  const [myClaims, setMyClaims] = useState<Record<string, number>>({
    '2': 1, // Start with 1 marg
  });

  // 3. Setup "Others" State (Static for demo, simulates active room)
  const otherClaims: Record<string, Array<MockClaim>> = {
    '2': [
      {
        memberId: '2',
        displayName: 'Rory',
        avatarUrl: null,
        quantity: 1,
        isMe: false,
        claimedAt: new Date('2026-05-10T12:01:00Z'),
      },
      {
        memberId: '3',
        displayName: 'Patricio',
        avatarUrl: null,
        quantity: 1,
        isMe: false,
        claimedAt: new Date('2026-05-10T12:02:00Z'),
      },
    ],
    '3': [
      {
        memberId: '3',
        displayName: 'Patricio',
        avatarUrl: null,
        quantity: 1,
        isMe: false,
        claimedAt: new Date('2026-05-10T12:02:00Z'),
      },
    ],
  };

  // Update Handler
  const handleUpdate = (itemId: string, newQty: number) => {
    setMyClaims((prev) => ({
      ...prev,
      [itemId]: Math.max(0, newQty),
    }));
  };

  // Math Calculation for "Your Share"
  let mySubtotal = 0;
  demoItems.forEach((item) => {
    const qty = myClaims[item.receiptItemId] || 0;
    if (qty > 0) {
      const unitPrice = item.price / item.quantity;
      mySubtotal += unitPrice * qty;
    }
  });

  const myTax = mySubtotal * 0.08;
  const myTip = mySubtotal * 0.2;
  const myTotal = mySubtotal + myTax + myTip;

  // Formatting for Breakdown Items
  const breakdownItems = demoItems
    .filter((item) => (myClaims[item.receiptItemId] || 0) > 0)
    .map((item) => ({
      id: item.receiptItemId,
      name: item.interpretedText,
      price: item.price / item.quantity, // Unit price for breakdown
      quantity: myClaims[item.receiptItemId],
    }));

  return (
    <div className="relative w-full max-w-5xl mx-auto mt-16 lg:mt-24 p-4 z-20">
      <div className="relative grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left: Collaborative Receipt */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Step 1: Select Items
            </span>
          </div>

          <div className="bg-background">
            <div className="border-x border-t border-border/70 bg-muted/30 px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-background border rounded-lg flex items-center justify-center text-muted-foreground">
                  <Receipt className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm">Friday Dinner</span>
              </div>

              {/* Changed: Display Grand Total instead of Receipt # */}
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
                  Total
                </span>
                <span className="font-bold text-sm leading-none">
                  ${receiptGrandTotal.toFixed(2)}
                </span>
              </div>
            </div>
            <ReceiptPaper showTopEdge={false}>
              {demoItems.map((item) => (
                <DemoCollabItemCard
                  key={item.receiptItemId}
                  item={item}
                  myQty={myClaims[item.receiptItemId] || 0}
                  others={otherClaims[item.receiptItemId] ?? []}
                  onUpdate={(q) => handleUpdate(item.receiptItemId, q)}
                />
              ))}
            </ReceiptPaper>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Try adjusting the quantity on the Margaritas.
          </p>
        </div>

        {/* Right: Settlement */}
        <div className="space-y-4 md:mt-12">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Step 2: Pay Share
            </span>
          </div>

          <PriceBreakdown
            label="Your Share"
            subtotal={mySubtotal}
            tax={myTax}
            tip={myTip}
            grandTotal={myTotal}
            items={breakdownItems}
            className="bg-background/50 backdrop-blur-sm shadow-sm"
          />

          <div className="text-center pt-2">
            <p className="text-[10px] text-muted-foreground font-mono">
              Math = (Subtotal + (Tax % + Tip %))
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
