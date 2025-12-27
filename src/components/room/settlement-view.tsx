import { useMemo } from 'react'
import type { FullRoomInfoDto, RoomMembership } from '@/server/dtos'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useSettlementCalculation } from '@/hooks/use-receipt-settlement'
import { AppHeader } from '../layout/app-header'
import { ReceiptLayoutShell } from '../layout/receipt-layout-shell'
import { PriceBreakdown, BreakdownItem } from '../price-breakdown'
import { SettlementWarning } from './settlement-warning'
import { VenmoButton } from './venmo-button'

interface SettlementViewProps {
    room: FullRoomInfoDto
    currentMember: RoomMembership
    onBack: () => void
}

export function SettlementView({ room, currentMember, onBack }: SettlementViewProps) {
    const settlements = useSettlementCalculation(room)
    const mySettlement = settlements.find(s => s.userId === currentMember.roomMemberId)
    const others = settlements.filter(s => s.userId !== currentMember.roomMemberId)

    // Calculate discrepancy
    const totalCalculated = settlements.reduce((acc, s) => acc + s.totalOwed, 0)
    const discrepancy = room.receipt.grandTotal - totalCalculated
    const hasDiscrepancy = Math.abs(discrepancy) > 0.05

    // Map to BreakdownItem format
    const myBreakdownItems: BreakdownItem[] = useMemo(() => {
        if (!mySettlement) return []

        return mySettlement.claimedItems.map(({ claimId, item, quantityClaimed }) => ({
            id: claimId,
            name: item.interpretedText,
            // Convert total price to unit price
            price: item.price / item.quantity,
            quantity: quantityClaimed,
        }))
    }, [mySettlement])

    return (
        <ReceiptLayoutShell
            header={
                <AppHeader
                    left={
                        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    }
                    title="Settlement"
                />
            }
        >
            {mySettlement && (
                <PriceBreakdown
                    label="Your Share"
                    subtotal={mySettlement.subtotal}
                    tax={mySettlement.taxShare}
                    tip={mySettlement.tipShare}
                    grandTotal={mySettlement.totalOwed}
                    items={myBreakdownItems}
                />
            )}

            {hasDiscrepancy && (
                <SettlementWarning
                    discrepancy={discrepancy}
                    className="mb-4"
                />
            )}

            {/* List of Everyone Else */}
            <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-medium text-muted-foreground">
                        Room Members
                    </h3>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                        {others.length}
                    </span>
                </div>

                {others.map((person) => (
                    <div
                        key={person.userId}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
                    >
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border">
                                <AvatarImage src={person.avatarUrl || undefined} />
                                <AvatarFallback>
                                    {person.displayName?.[0] || '?'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium text-sm">{person.displayName}</p>
                                <p className="text-xs text-muted-foreground">
                                    {person.claimedItemsCount} items
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-sm">${person.totalOwed.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                                ${person.subtotal.toFixed(2)} + fees
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            <VenmoButton />
        </ReceiptLayoutShell>
    )
}
