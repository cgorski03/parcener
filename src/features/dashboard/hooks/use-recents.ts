import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getUserRecentReceiptsRpc,
  getUserRecentRoomsRpc,
} from '@/features/dashboard/server/recent-activity-rpc';
import { ReceiptQueryKeys } from '@/features/receipt-review/hooks/use-get-receipt';
import { RoomQueryKeys } from '@/features/room/hooks/use-room';

export function useRecentReceipts() {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ReceiptQueryKeys.recents(),
    queryFn: async () => {
      const receipts = await getUserRecentReceiptsRpc();
      if (!receipts) {
        return [];
      }
      const filteredReceipts = receipts.filter((receipt) => receipt != null);
      // Seed the individual caches
      filteredReceipts.forEach((receipt) => {
        queryClient.setQueryData(
          ReceiptQueryKeys.detail(receipt?.receiptId),
          receipt,
          { updatedAt: Date.now() },
        );
      });
      return filteredReceipts;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useRecentRooms() {
  return useQuery({
    queryKey: RoomQueryKeys.recents(),
    queryFn: async () => await getUserRecentRoomsRpc(),
    staleTime: 1000 * 60 * 5,
  });
}
