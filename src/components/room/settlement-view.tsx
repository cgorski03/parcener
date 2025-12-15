import { FullRoomInfoDto, RoomMembership } from '@/server/dtos'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Share2, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSettlementCalculation } from '@/hooks/use-receipt-settlement'

interface SettlementViewProps {
    room: FullRoomInfoDto
    currentMember: RoomMembership
    onBack: () => void
}

export function SettlementView({ room, currentMember, onBack }: SettlementViewProps) {
    const settlements = useSettlementCalculation(room)

    const mySettlement = settlements.find(s => s.userId === currentMember.roomMemberId)
    const others = settlements.filter(s => s.userId !== currentMember.roomMemberId)

    // Calculate remaining/unclaimed amount
    const totalCalculated = settlements.reduce((acc, s) => acc + s.totalOwed, 0)
    const discrepancy = room.receipt.grandTotal - totalCalculated
    const hasUnclaimedItems = Math.abs(discrepancy) > 0.05 // Tolerance for floating point

    return (
        <div className="flex flex-col h-full bg-muted/10">
            {/* Header */}
            <div className="flex items-center p-4 border-b bg-background sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2 mr-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="font-semibold text-lg">Settlement</h1>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6 max-w-md mx-auto">

                    {/* My Total Card - Highlighted */}
                    {mySettlement && (
                        <Card className="border-primary/20 shadow-md bg-gradient-to-br from-background to-primary/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                    Your Share
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-baseline mb-4">
                                    <span className="text-4xl font-bold tracking-tight">
                                        ${mySettlement.totalOwed.toFixed(2)}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {mySettlement.claimedItemsCount} items
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <Row label="Subtotal" amount={mySettlement.subtotal} />
                                    <Row label="Tax" amount={mySettlement.taxShare} muted />
                                    <Row label="Tip" amount={mySettlement.tipShare} muted />
                                </div>

                                <div className="mt-6">
                                    <Button className="w-full gap-2 size-lg" size="lg">
                                        <Wallet className="w-4 h-4" />
                                        Mark as Paid
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Warning if items are unclaimed */}
                    {hasUnclaimedItems && (
                        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4 text-sm text-yellow-600 dark:text-yellow-400">
                            <p className="font-medium flex items-center gap-2">
                                ⚠️ Unclaimed Amount: ${discrepancy.toFixed(2)}
                            </p>
                            <p className="opacity-90 mt-1">
                                The total of everyone's shares is less than the receipt total. Some items may be unclaimed.
                            </p>
                        </div>
                    )}

                    {/* List of Everyone Else */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground px-1">
                            Room Members ({others.length})
                        </h3>

                        {others.map((person) => (
                            <div
                                key={person.userId}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border">
                                        <AvatarImage src={person.avatarUrl || undefined} />
                                        <AvatarFallback>{person.displayName?.[0] || '?'}</AvatarFallback>
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

                    <Button variant="outline" className="w-full gap-2">
                        <Share2 className="w-4 h-4" />
                        Share Breakdown
                    </Button>

                    <div className="h-8" /> {/* Spacer */}
                </div>
            </ScrollArea>
        </div>
    )
}

function Row({ label, amount, muted }: { label: string, amount: number, muted?: boolean }) {
    return (
        <div className={cn("flex justify-between", muted && "text-muted-foreground")}>
            <span>{label}</span>
            <span>${amount.toFixed(2)}</span>
        </div>
    )
}
