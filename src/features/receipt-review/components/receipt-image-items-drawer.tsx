import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import {
  useGetReceiptReview,
  useReceiptIsValid,
  useReceiptItems,
} from '../hooks/use-get-receipt';
import { hasData } from '../lib/receipt-utils';
import { CompactReceiptItemCard } from './compact-receipt-item-card';
import { ReceiptActionsPanel } from './receipt-actions-panel';
import { useReceiptItemSheet } from './receipt-item-sheet-provider';
import { Button } from '@/shared/components/ui/button';

interface ReceiptImageItemsDrawerProps {
  receiptId: string;
}

export function ReceiptImageItemsDrawer({
  receiptId,
}: ReceiptImageItemsDrawerProps) {
  const { openCreateItem, openEditItem } = useReceiptItemSheet();
  const { data: items, isLoading } = useReceiptItems(receiptId);
  const { data: receipt } = useGetReceiptReview(receiptId);
  const { isError: receiptNotValid } = useReceiptIsValid(receiptId);
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
        <Button variant="outline" size="sm" onClick={openCreateItem}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6">
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
              <CompactReceiptItemCard
                key={item.receiptItemId}
                item={item}
                onEdit={() => openEditItem(item.receiptItemId)}
              />
            ))}
          </div>
        )}

        {hasData(receipt) && (
          <div className="pt-4 mt-4 border-t border-muted/40">
            <ReceiptActionsPanel
              receipt={receipt}
              receiptNotValid={receiptNotValid}
            />
          </div>
        )}
      </div>
    </div>
  );
}
