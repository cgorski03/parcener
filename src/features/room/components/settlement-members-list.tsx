import { useState } from 'react';
import { ChevronDown, UserPlus } from 'lucide-react';
import type { UserSettlement } from '@/features/receipt-review/hooks/use-receipt-settlement';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import { cn } from '@/shared/lib/utils';

interface SettlementMembersListProps {
  members: Array<UserSettlement>;
}

export function SettlementMembersList({ members }: SettlementMembersListProps) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <UserPlus className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="mt-4 text-sm font-medium">No other members yet</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[180px]">
          Share the room link to start splitting.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground px-1 mb-3">
        {members.length} other {members.length === 1 ? 'member' : 'members'}
      </p>
      {members.map((member) => (
        <MemberCard key={member.userId} member={member} />
      ))}
    </div>
  );
}

function MemberCard({ member }: { member: UserSettlement }) {
  const [expanded, setExpanded] = useState(false);

  const items = member.claimedItems.map(({ claimId, item, quantityClaimed }) => ({
    id: claimId,
    name: item.interpretedText,
    unitPrice: item.price / item.quantity,
    quantity: quantityClaimed,
  }));

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={member.avatarUrl || undefined} />
            <AvatarFallback>{member.displayName[0] || '?'}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="font-medium text-sm">{member.displayName}</p>
            <p className="text-xs text-muted-foreground">
              {member.claimedItemsCount > 0
                ? `${member.claimedItemsCount} item${member.claimedItemsCount !== 1 ? 's' : ''}`
                : 'No items claimed'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="font-bold text-sm tabular-nums">
            ${member.totalOwed.toFixed(2)}
          </p>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              expanded && 'rotate-180',
            )}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="pt-2 border-t">
            {items.length > 0 ? (
              <div className="space-y-1.5 mb-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.quantity > 1 && (
                        <span className="text-foreground font-medium mr-1">
                          {item.quantity}x
                        </span>
                      )}
                      {item.name}
                    </span>
                    <span className="tabular-nums">
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">
                No items claimed yet
              </p>
            )}

            <div className="space-y-1 pt-2 border-t text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">${member.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span className="tabular-nums">${member.taxShare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tip</span>
                <span className="tabular-nums">${member.tipShare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-1">
                <span>Total</span>
                <span className="tabular-nums">${member.totalOwed.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
