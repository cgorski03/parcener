import { useEffect, useState } from 'react';
import type { ReceiptItemDto } from '@/shared/dto/types';
import { CollaborativeRoomHeader } from '@/shared/components/layout/collaborative-room-header';
import { BaseReceiptItemCard } from '@/shared/components/item-card/base-receipt-item-card';
import { RoomMemberAvatar } from '@/features/room/components/room-member-avatar';

// --- Mock Data Types ---
type MockClaim = {
  memberId: string;
  displayName: string;
  avatarUrl: string | null;
  quantity: number;
};

// --- Visual-Only Card for the Simulation ---
function SimulatedItemCard({
  item,
  others,
}: {
  item: ReceiptItemDto;
  others: Array<MockClaim>;
}) {
  // Determine if fully claimed (for visual dimming)
  const claimedQty = others.reduce((acc, curr) => acc + curr.quantity, 0);
  const isFullyClaimed = claimedQty >= item.quantity;

  return (
    <BaseReceiptItemCard
      item={item}
      // If fully claimed by others, dim it to show "done" state
      variant={isFullyClaimed ? 'dimmed' : 'default'}
      // Disable click for this auto-playing demo
      className="pointer-events-none"
      rightElement={
        others.length > 0 && (
          <div className="flex items-center gap-1 transition-all duration-500 ease-in-out">
            {others.map((claim) => (
              <div
                key={claim.memberId}
                className="relative animate-in zoom-in slide-in-from-bottom-2 duration-500 fade-in"
              >
                <RoomMemberAvatar
                  id={claim.memberId}
                  avatarUrl={claim.avatarUrl}
                  displayName={claim.displayName}
                  size="sm"
                />
              </div>
            ))}
          </div>
        )
      }
    />
  );
}

export function RealtimeSimulation() {
  // Define the story: "Patricio claims coffee", then "Rory claims pancakes"
  const [step, setStep] = useState(0);

  const items: Array<ReceiptItemDto> = [
    {
      receiptItemId: 'sim-1',
      quantity: 1,
      interpretedText: 'Short Stack Pancakes',
      price: 14.0,
      rawText: '',
    },
    {
      receiptItemId: 'sim-2',
      quantity: 1,
      interpretedText: 'Cold Brew Coffee',
      price: 5.5,
      rawText: '',
    },
  ];

  // Define states for each step of the animation loop
  const states = [
    // Step 0: Initial - Nothing claimed
    { 'sim-1': [], 'sim-2': [] },
    // Step 1: Patricio grabs the Coffee
    {
      'sim-1': [],
      'sim-2': [
        {
          memberId: '3',
          displayName: 'Patricio',
          avatarUrl: null,
          quantity: 1,
        },
      ],
    },
    // Step 2: Rory grabs the Pancakes
    {
      'sim-1': [
        { memberId: '2', displayName: 'Rory', avatarUrl: null, quantity: 1 },
      ],
      'sim-2': [
        {
          memberId: '3',
          displayName: 'Patricio',
          avatarUrl: null,
          quantity: 1,
        },
      ],
    },
    // Step 3: Pause/Hold state (same as 2)
    {
      'sim-1': [
        { memberId: '2', displayName: 'Rory', avatarUrl: null, quantity: 1 },
      ],
      'sim-2': [
        {
          memberId: '3',
          displayName: 'Patricio',
          avatarUrl: null,
          quantity: 1,
        },
      ],
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % states.length);
    }, 3500); // 3.5s per step = Very Slow, not distracting
    return () => clearInterval(interval);
  }, []);

  const currentClaims = states[step];

  return (
    <div className="w-full max-w-sm bg-background  z-10 overflow-hidden [&>*]:rounded-t-[inherit] rounded-lg shadow-sm select-none">
      {/* Header showing active members */}
      <CollaborativeRoomHeader
        roomId="demo"
        receiptId="demo"
        title="Sunday Brunch"
        isHost={true}
        status="active"
        onSelectFilter={() => {}}
        activeFilterId={null}
        members={[
          {
            roomMemberId: '1',
            displayName: 'You',
            avatarUrl: null,
            isGuest: false,
          },
          {
            roomMemberId: '2',
            displayName: 'Rory',
            avatarUrl: null,
            isGuest: false,
          },
          {
            roomMemberId: '3',
            displayName: 'Patricio',
            avatarUrl: null,
            isGuest: false,
          },
        ]}
      />

      {/* The Item List */}
      <div className="p-2 space-y-2 bg-muted/5 min-h-[140px] transition-all">
        {items.map((item) => (
          <SimulatedItemCard
            key={item.receiptItemId}
            item={item}
            others={
              currentClaims[
                item.receiptItemId as keyof typeof currentClaims
              ] as Array<MockClaim>
            }
          />
        ))}
      </div>
    </div>
  );
}
