import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useReadyReceipt } from '../hooks/use-ready-receipt';
import { useReceiptIsValid } from '../hooks/use-get-receipt';
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
  const { items, data: receipt } = useReadyReceipt(receiptId);
  const { isError: receiptNotValid } = useReceiptIsValid(receiptId);

  const itemCountLabel = useMemo(() => {
    return `${items.length} ${items.length === 1 ? 'item' : 'items'}`;
  }, [items.length]);

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      data-testid="receipt-image-items-drawer"
    >
      <div className="flex items-center justify-between border-b  px-4 py-2">
        <div>
          <div className="text-sm font-semibold">Items</div>
          <div className="text-xs text-muted-foreground">{itemCountLabel}</div>
        </div>
        <Button variant="outline" size="sm" onClick={openCreateItem}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-6">
        {items.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No items yet.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <CompactReceiptItemCard
                key={item.receiptItemId}
                item={item}
                onEdit={() => openEditItem(item.receiptItemId)}
              />
            ))}
          </div>
        )}

        <div className="pt-4 mt-4 border-t border-muted/40">
          <ReceiptActionsPanel
            receipt={receipt}
            receiptNotValid={receiptNotValid}
          />
        </div>
      </div>
    </div>
  );
}
