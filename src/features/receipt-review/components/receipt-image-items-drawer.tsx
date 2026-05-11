import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useReadyReceipt } from '../hooks/use-ready-receipt';
import { useReceiptIsValid } from '../hooks/use-get-receipt';
import { CompactReceiptItemCard } from './compact-receipt-item-card';
import { ReceiptRoomAction } from './receipt-room-action';
import { ReceiptTotalsPanel } from './receipt-totals-panel';
import { useReceiptItemSheet } from './receipt-item-sheet-provider';
import {
  ReceiptPaper,
  ReceiptPaperSectionBreak,
} from '@/shared/components/receipt-paper';

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
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div>
          <div className="text-sm font-semibold">Items</div>
          <div className="text-xs text-muted-foreground">{itemCountLabel}</div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-6">
        <ReceiptPaper className="mb-4">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              No items yet.
            </div>
          ) : (
            items.map((item) => (
              <CompactReceiptItemCard
                key={item.receiptItemId}
                item={item}
                onEdit={() => openEditItem(item.receiptItemId)}
              />
            ))
          )}

          <button
            type="button"
            className="relative flex w-full items-center justify-center gap-3 px-4 py-6 font-mono text-sm transition-colors hover:bg-muted/20 after:pointer-events-none after:absolute after:inset-x-4 after:bottom-0 after:border-b-2 after:border-dashed after:border-foreground/35"
            onClick={openCreateItem}
          >
            <Plus className="size-4" />
            Add Custom Item
          </button>

          <ReceiptPaperSectionBreak>
            <ReceiptTotalsPanel
              receipt={receipt}
              className="rounded-none border-0 bg-transparent px-4 py-5 shadow-none transition-colors active:bg-accent/50"
            />
          </ReceiptPaperSectionBreak>
        </ReceiptPaper>

        <ReceiptRoomAction
          receipt={receipt}
          receiptNotValid={receiptNotValid}
        />
      </div>
    </div>
  );
}
