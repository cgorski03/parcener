import { useMemo } from 'react'
import { FullRoomInfoDto } from '@/server/dtos'

export interface UserSettlement {
    userId: string
    displayName: string
    avatarUrl: string | null
    subtotal: number
    taxShare: number
    tipShare: number
    totalOwed: number
    claimedItemsCount: number
}

export function useSettlementCalculation(room: FullRoomInfoDto) {
    return useMemo(() => {
        const { receipt, members, claims } = room

        // 1. Calculate subtotal per member based on claims
        const memberSubtotals = new Map<string, number>()
        const memberItemCounts = new Map<string, number>()

        // Initialize maps
        members.forEach(m => {
            memberSubtotals.set(m.roomMemberId, 0)
            memberItemCounts.set(m.roomMemberId, 0)
        })

        claims.forEach(claim => {
            const item = receipt.items.find(i => i.receiptItemId === claim.receiptItemId)
            if (!item) return

            const quantityClaimed = parseFloat(claim.quantity.toString())
            const itemPrice = item.price / item.quantity
            const costForClaim = itemPrice * quantityClaimed

            const currentSub = memberSubtotals.get(claim.memberId) || 0
            memberSubtotals.set(claim.memberId, currentSub + costForClaim)

            const currentCount = memberItemCounts.get(claim.memberId) || 0
            memberItemCounts.set(claim.memberId, currentCount + quantityClaimed)
        })

        // 2. Calculate Ratios for Tax/Tip
        // We use the calculated subtotal from claims, not the receipt subtotal 
        // to ensure we only split based on what was actually claimed.
        // (Or you can use receipt.subtotal if you want to include unclaimed items in the ratio denominator)
        const safeSubtotal = receipt.subtotal || 1

        // 3. Generate User Settlements
        const settlements: UserSettlement[] = members.map(member => {
            const mySubtotal = memberSubtotals.get(member.roomMemberId) || 0
            const ratio = mySubtotal / safeSubtotal

            const myTax = receipt.tax * ratio
            const myTip = receipt.tip * ratio

            return {
                userId: member.roomMemberId,
                displayName: member.displayName || 'Guest',
                avatarUrl: member.avatarUrl,
                subtotal: mySubtotal,
                taxShare: myTax,
                tipShare: myTip,
                totalOwed: mySubtotal + myTax + myTip,
                claimedItemsCount: memberItemCounts.get(member.roomMemberId) || 0
            }
        })

        // Sort by amount owed (descending)
        return settlements.sort((a, b) => b.totalOwed - a.totalOwed)
    }, [room])
}
