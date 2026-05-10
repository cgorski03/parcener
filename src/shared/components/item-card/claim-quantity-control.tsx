import { Minus, Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { RoomMemberAvatar } from '@/features/room/components/room-member-avatar';
import { cn } from '@/shared/lib/utils';
import { EnrichedClaim } from '@/features/room/hooks/use-claims';

type ClaimUnit = Omit<EnrichedClaim, 'quantity'>;

interface ClaimQuantityControlProps {
  totalQuantity: number;
  myQuantity: number;
  othersQuantity: number;
  myClaim: EnrichedClaim | null;
  otherClaims: Array<EnrichedClaim>;
  onIncrement: () => void;
  onDecrement: () => void;
  onPunchTap: (delta: number) => void;
}

const MAX_PUNCH_SLOTS = 4;

function getClaimTime(claim: { claimedAt?: string | Date | null }) {
  return claim.claimedAt ? new Date(claim.claimedAt).getTime() : 0;
}

function expandClaimUnits(claim: EnrichedClaim): Array<ClaimUnit> {
  return Array.from({ length: claim.quantity }).map(() => ({
    memberId: claim.memberId,
    avatarUrl: claim.avatarUrl,
    displayName: claim.displayName,
    claimedAt: claim.claimedAt,
    isMe: claim.isMe,
  }));
}

export function ClaimQuantityControl({
  totalQuantity,
  myQuantity,
  othersQuantity,
  myClaim,
  otherClaims,
  onIncrement,
  onDecrement,
  onPunchTap,
}: ClaimQuantityControlProps) {
  const remaining = totalQuantity - myQuantity - othersQuantity;
  const canIncrement = remaining > 0;
  const canDecrement = myQuantity > 0;
  const usePunchCard = totalQuantity <= MAX_PUNCH_SLOTS;
  const liveMyClaim = myClaim
    ? {
        ...myClaim,
        quantity: myQuantity,
      }
    : null;
  const claimUnits = [...(liveMyClaim ? [liveMyClaim] : []), ...otherClaims]
    .sort((a, b) => getClaimTime(a) - getClaimTime(b))
    .flatMap(expandClaimUnits);

  return (
    <div className="pt-1.5">
      <div className="flex items-end justify-between gap-4">
        <div className="flex-1 min-w-0">
          {usePunchCard ? (
            <div className="relative flex items-center gap-2.5 h-10">
              {totalQuantity > 1 && (
                <div
                  className="pointer-events-none absolute top-1/2 h-[2px] -translate-y-1/2 bg-muted-foreground/45"
                  style={{
                    left: '1rem',
                    width: `calc((${totalQuantity} - 1) * 2.625rem)`,
                  }}
                />
              )}
              {Array.from({ length: totalQuantity }).map((_, index) => {
                const owner = claimUnits.at(index);
                const slotClass = owner
                  ? 'border-muted-foreground/35 bg-background'
                  : 'border-muted-foreground/30 bg-background';
                return (
                  <button
                    key={index}
                    type="button"
                    className={cn(
                      'relative flex h-8 w-8 items-center justify-center rounded-full border transition-colors overflow-hidden',
                      slotClass,
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!owner) {
                        onPunchTap(1);
                        return;
                      }
                      if (owner && owner.isMe) {
                        onPunchTap(-1);
                      }
                    }}
                  >
                    {owner ? (
                      <RoomMemberAvatar
                        id={owner.memberId}
                        avatarUrl={owner.avatarUrl}
                        displayName={owner.displayName}
                        size="xs"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden relative">
              <div
                className="absolute top-0 left-0 h-full bg-muted-foreground/30 transition-all duration-300"
                style={{ width: `${(othersQuantity / totalQuantity) * 100}%` }}
              />
              <div
                className="absolute top-0 h-full bg-primary transition-all duration-300 ease-out"
                style={{
                  left: `${(othersQuantity / totalQuantity) * 100}%`,
                  width: `${(myQuantity / totalQuantity) * 100}%`,
                }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 bg-background border rounded-full px-1.5 py-1.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-muted text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onDecrement();
            }}
            disabled={!canDecrement}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>

          <div className="flex flex-col items-center min-w-[2.5rem]">
            <span
              className={cn(
                'text-sm font-bold tabular-nums leading-none transition-colors',
                remaining === 0 ? 'text-green-600' : 'text-foreground',
              )}
            >
              {myQuantity}
            </span>
            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider leading-none mt-0.5">
              of {totalQuantity}
            </span>
          </div>

          <Button
            size="icon"
            className={cn(
              'h-7 w-7 rounded-full shadow-none transition-all',
              canIncrement
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted opacity-50',
            )}
            onClick={(e) => {
              e.stopPropagation();
              onIncrement();
            }}
            disabled={!canIncrement}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
