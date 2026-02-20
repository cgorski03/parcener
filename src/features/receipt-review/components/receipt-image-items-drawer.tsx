import { useMemo } from 'react';
import { useReceiptItems } from '../hooks/use-get-receipt';
import { CompactReceiptItemCard } from './compact-receipt-item-card';

interface ReceiptImageItemsDrawerProps {
  receiptId: string;
}

export function ReceiptImageItemsDrawer({
  receiptId,
}: ReceiptImageItemsDrawerProps) {
  const { data: items, isLoading } = useReceiptItems(receiptId);
  const safeItems = items ?? [];

  const itemCountLabel = useMemo(() => {
    return `${safeItems.length} ${safeItems.length === 1 ? 'item' : 'items'}`;
  }, [safeItems.length]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-4 px-4 pb-2 pt-3">
        <div>
          <div className="text-sm font-semibold">Items</div>
          <div className="text-xs text-muted-foreground">{itemCountLabel}</div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Loading items...
          </div>
        ) : safeItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No items yet.
          </div>
        ) : (
          <div className="space-y-2">
            {safeItems.map((item) => (
              <CompactReceiptItemCard key={item.receiptItemId} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
