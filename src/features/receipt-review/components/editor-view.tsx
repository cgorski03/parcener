import { Pencil, Plus } from 'lucide-react';
import { useReceiptIsValid } from '../hooks/use-get-receipt';
import { useReadyReceipt } from '../hooks/use-ready-receipt';
import { ReviewReceiptHeader } from './receipt-header';
import { ReceiptImageViewer } from './receipt-image-viewer';
import {
  ReceiptItemSheetProvider,
  useReceiptItemSheet,
} from './receipt-item-sheet-provider';
import { ReceiptActionsPanel } from './receipt-actions-panel';
import type { ReceiptWithRoom } from '../server/get-receipt-service';
import { Button } from '@/shared/components/ui/button';
import { ReceiptLayoutShell } from '@/shared/components/layout/receipt-layout-shell';
import { ReviewItemCard } from '@/shared/components/item-card/review-item-card';
import { Route } from '@/routes/_authed/receipt.review.$receiptId';

interface ReceiptEditorProps {
  initialReceipt: ReceiptWithRoom;
}

export function ReceiptEditorView({ initialReceipt }: ReceiptEditorProps) {
  const receiptId = initialReceipt.receiptId;
  // this live receipt and using it from the cache allows the proliferation of optimistic updates
  const { data: liveReceipt } = useReadyReceipt(receiptId, initialReceipt);
  const { isError: receiptNotValid, isFetching: receiptValidFetching } =
    useReceiptIsValid(receiptId);
  const { view } = Route.useSearch();

  return (
    <ReceiptItemSheetProvider
      receiptId={receiptId}
      roomId={liveReceipt.roomId ?? null}
    >
      <ReceiptEditorContent
        receipt={liveReceipt}
        receiptNotValid={receiptNotValid}
        receiptValidFetching={receiptValidFetching}
        view={view}
      />
    </ReceiptItemSheetProvider>
  );
}

function ReceiptEditorContent({
  receipt,
  receiptNotValid,
  receiptValidFetching,
  view,
}: {
  receipt: ReceiptWithRoom;
  receiptNotValid: boolean;
  receiptValidFetching: boolean;
  view: 'items' | 'image';
}) {
  const { openCreateItem, openEditItem } = useReceiptItemSheet();
  const receiptItems = receipt.items;

  return (
    <ReceiptLayoutShell
      fullBleed={view === 'image'}
      header={
        <ReviewReceiptHeader
          title={receipt.title ?? 'Set Title'}
          itemCount={receiptItems.length}
          receiptIsInvalid={receiptNotValid}
          receiptIsValidPending={receiptValidFetching}
        />
      }
    >
      {view === 'image' ? (
        <ReceiptImageViewer receiptId={receipt.receiptId} />
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {receiptItems.map((item) => (
              <ReviewItemCard
                key={item.receiptItemId}
                item={item}
                onEdit={() => openEditItem(item.receiptItemId)}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="lg"
            className="w-full mb-6 border-dashed"
            onClick={openCreateItem}
          >
            <Plus className="size-4 mr-2" />
            Add Custom Item
          </Button>

          <div className="relative group mt-6">
            <ReceiptActionsPanel
              receipt={receipt}
              receiptNotValid={receiptNotValid}
              className="pr-10 border-primary/20 active:bg-accent/50 transition-colors shadow-sm"
            />

            <div className="absolute top-4 right-4 pointer-events-none">
              <div className="bg-primary/10 p-2 rounded-full text-primary">
                <Pencil className="size-4" />
              </div>
            </div>
          </div>
        </>
      )}
    </ReceiptLayoutShell>
  );
}
