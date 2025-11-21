import { claimItemRpc, FullRoomInfo } from "@/server/room/room-rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RoomQueryKeys } from "./useRoom";
import { useMemo } from "react";
import { RoomMemberSelect } from "@/server/db";


type EnrichedClaim = {
    quantity: number;
    memberId: string;
    displayName: string;
    isMe: boolean;
};

export type ItemWithClaims = {
    item: ReceiptItemDto;
    myClaim: EnrichedClaim | undefined;
    otherClaims: EnrichedClaim[];
    totalClaimed: number;
    remainingQuantity: number;
}

export function useClaimItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (request: { roomId: string; receiptItemId: string; quantity: number }) => {
            await claimItemRpc({ data: { ...request } })
        }, onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: RoomQueryKeys.detail(variables.roomId)
            })
        },
        onError: (error) => {
            console.error('Failed to create receipt room', error);
        },
    });
}

export const useEnrichedClaimItems = (room: FullRoomInfo, myMembership: RoomMemberSelect) => {
    const currentClaims = room.claims;

    const memberMap = useMemo(() => {
        return new Map(room.members.map(m => [m.id, m]));

    }, [room.members])

    const itemsWithClaims = useMemo(() => {
        const claimsByItem = new Map<string, EnrichedClaim[]>();
        currentClaims.forEach(claim => {
            const memberInfo = memberMap.get(claim.memberId);
            const enriched: EnrichedClaim = {
                quantity: parseFloat(claim.quantity),
                memberId: claim.memberId,
                displayName: memberInfo?.displayName ?? 'Unknown',
                isMe: claim.memberId === myMembership.id,
            }
            const existingClaims = claimsByItem.get(claim.receiptItemId) || [];
            existingClaims.push(enriched);
            claimsByItem.set(claim.receiptItemId, existingClaims);
        })
        return room.receipt?.items.map(item => {
            const claims = claimsByItem.get(item.id) || [];
            const myClaim = claims.find(c => c.isMe);
            const otherClaims = claims.filter(c => !c.isMe);

            const totalClaimedQty = claims.reduce((sum, c) => sum + c.quantity, 0);

            return {
                item,
                myClaim,
                otherClaims,
                totalClaimed: totalClaimedQty,
                remainingQuantity: item.quantity - totalClaimedQty
            };
        });
    }, [room.receipt?.items, currentClaims, memberMap, myMembership.id]);

    return { itemsWithClaims };
} 
