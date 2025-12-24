import { useMemo } from 'react';
import type { FullRoomInfoDto, ReceiptItemDto } from '@/server/dtos';

export interface UserSettlement {
    userId: string
    displayName: string
    avatarUrl: string | null
    subtotal: number
    taxShare: number
    tipShare: number
    totalOwed: number
    claimedItemsCount: number
    // Store the raw items for passing to PriceBreakdown
    claimedItems: Array<{
        claimId: string
        item: ReceiptItemDto
        quantityClaimed: number
    }>
}

export function useSettlementCalculation(room: FullRoomInfoDto) {
    return useMemo(() => {
        const { receipt, members, claims } = room

        // 1. Initialize maps
        const memberSubtotals = new Map<string, number>()
        const memberItemCounts = new Map<string, number>()
        const memberClaimedItems = new Map<string, UserSettlement['claimedItems']>()

        members.forEach(m => {
            memberSubtotals.set(m.roomMemberId, 0)
            memberItemCounts.set(m.roomMemberId, 0)
            memberClaimedItems.set(m.roomMemberId, [])
        })

        // 2. Process each claim
        claims.forEach(claim => {
            const item = receipt.items.find(i => i.receiptItemId === claim.receiptItemId)
            if (!item) return

            const unitPrice = item.price / item.quantity
            const quantityClaimed = parseFloat(claim.quantity.toString())
            const costForClaim = unitPrice * quantityClaimed

            // Update subtotal
            const currentSub = memberSubtotals.get(claim.memberId) || 0
            memberSubtotals.set(claim.memberId, currentSub + costForClaim)

            // Update item count
            const currentCount = memberItemCounts.get(claim.memberId) || 0
            memberItemCounts.set(claim.memberId, currentCount + quantityClaimed)

            // Store item for breakdown
            const itemsList = memberClaimedItems.get(claim.memberId) || []
            itemsList.push({
                claimId: claim.id,
                item,
                quantityClaimed,
            })
            memberClaimedItems.set(claim.memberId, itemsList)
        })

        // 3. Calculate ratios
        const safeSubtotal = receipt.subtotal || 1

        // 4. Generate settlements
        const settlements: UserSettlement[] = members.map(member => {
            const mySubtotal = memberSubtotals.get(member.roomMemberId) || 0
            const ratio = mySubtotal / safeSubtotal

            return {
                userId: member.roomMemberId,
                displayName: member.displayName || 'Guest',
                avatarUrl: member.avatarUrl,
                subtotal: mySubtotal,
                taxShare: receipt.tax * ratio,
                tipShare: receipt.tip * ratio,
                totalOwed: mySubtotal + (receipt.tax * ratio) + (receipt.tip * ratio),
                claimedItemsCount: memberItemCounts.get(member.roomMemberId) || 0,
                claimedItems: memberClaimedItems.get(member.roomMemberId) || [],
            }
        })

        return settlements.sort((a, b) => b.totalOwed - a.totalOwed)
    }, [room])
}
