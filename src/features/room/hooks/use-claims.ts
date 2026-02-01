import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { claimItemRpc } from '../server/room-rpc';
import { RoomQueryKeys } from './use-room';
import type {
  FullRoomInfoDto,
  ReceiptItemDto,
  RoomMembership,
} from '@/shared/dto/types';
import { generateIdNotCryptographicallySecure } from '@/shared/lib/utils';

type EnrichedClaim = {
  quantity: number;
  memberId: string;
  displayName: string;
  avatarUrl: string | null;
  isMe: boolean;
};

export type ItemWithClaims = {
  item: ReceiptItemDto;
  myClaim: EnrichedClaim | undefined;
  otherClaims: Array<EnrichedClaim>;
  otherClaimedQty: number;
};

export function useClaimItem(myMembershipId: string) {
  const _memId = myMembershipId;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: {
      roomId: string;
      receiptItemId: string;
      quantity: number;
    }) => {
      const { roomId, receiptItemId, quantity } = request;
      // 1. Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({
        queryKey: RoomQueryKeys.detail(roomId),
      });

      // 2. Snapshot previous value
      const previousRoom = queryClient.getQueryData(
        RoomQueryKeys.detail(roomId),
      ) as FullRoomInfoDto;

      // 3. Optimistically update the cache
      queryClient.setQueryData(
        RoomQueryKeys.detail(roomId),
        (old: FullRoomInfoDto) => {
          // Manually inject the fake claim into the 'claims' array
          // This makes the UI update INSTANTLY without waiting for the server
          const filteredClaims = old.claims.filter(
            (claim) =>
              !(
                claim.receiptItemId == receiptItemId && claim.memberId == _memId
              ),
          );
          return {
            ...old,
            claims:
              quantity === 0
                ? filteredClaims
                : [
                    ...filteredClaims,
                    {
                      id: generateIdNotCryptographicallySecure(),
                      roomId,
                      receiptItemId,
                      memberId: _memId,
                      claimedAt: new Date(),
                      quantity: quantity.toFixed(2),
                    },
                  ],
          };
        },
      );
      await claimItemRpc({ data: { roomId, receiptItemId, quantity } });
      return { previousRoom };
    },
    onError: (_, newTodo, onMutateResult) => {
      const previousRoom = (onMutateResult as { previousRoom: FullRoomInfoDto })
        .previousRoom;
      // If server fails, roll back
      queryClient.setQueryData(['room', newTodo.roomId], previousRoom);
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success to ensure sync
      queryClient.invalidateQueries({ queryKey: ['room', variables.roomId] });
    },
  });
}

export const useEnrichedClaimItems = (
  room: FullRoomInfoDto,
  myMembership: RoomMembership,
) => {
  const currentClaims = room.claims;

  const memberMap = useMemo(() => {
    return new Map(room.members.map((m) => [m.roomMemberId, m]));
  }, [room.members]);

  const itemsWithClaims = useMemo(() => {
    const claimsByItem = new Map<string, Array<EnrichedClaim>>();

    currentClaims.forEach((claim) => {
      const memberInfo = memberMap.get(claim.memberId);
      const enriched: EnrichedClaim = {
        quantity: parseFloat(claim.quantity),
        memberId: claim.memberId,
        displayName: memberInfo?.displayName ?? 'Unknown',
        avatarUrl: memberInfo?.avatarUrl ?? null,
        isMe: claim.memberId === myMembership.roomMemberId,
      };
      const existingClaims = claimsByItem.get(claim.receiptItemId) || [];
      existingClaims.push(enriched);
      claimsByItem.set(claim.receiptItemId, existingClaims);
    });

    return room.receipt.items.map((item) => {
      const claims = claimsByItem.get(item.receiptItemId) || [];
      const myClaim = claims.find((c) => c.isMe);
      const otherClaims = claims.filter((c) => !c.isMe);

      const otherClaimedQty = otherClaims.reduce(
        (sum, c) => sum + c.quantity,
        0,
      );

      return {
        item,
        myClaim,
        otherClaims,
        otherClaimedQty,
      };
    });
  }, [room.receipt.items, currentClaims, memberMap, myMembership.roomMemberId]);

  const claimStats = useMemo(() => {
    let totalQty = 0;
    let claimedQty = 0;
    let unclaimedAmount = 0;

    for (const itemData of itemsWithClaims) {
      const { item, myClaim, otherClaimedQty } = itemData;
      const totalClaimed = (myClaim?.quantity ?? 0) + otherClaimedQty;
      const unclaimed = Math.max(0, item.quantity - totalClaimed);
      const unitPrice = item.price / item.quantity;

      totalQty += item.quantity;
      claimedQty += Math.min(totalClaimed, item.quantity);
      unclaimedAmount += unclaimed * unitPrice;
    }

    const allItemsClaimed = claimedQty >= totalQty;
    const claimProgress = totalQty > 0 ? (claimedQty / totalQty) * 100 : 0;

    return { allItemsClaimed, claimProgress, unclaimedAmount };
  }, [itemsWithClaims]);

  return { itemsWithClaims, ...claimStats };
};
