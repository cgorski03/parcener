import { useMemo, useState } from 'react';
import { Label } from '@radix-ui/react-label';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useUpdateReceiptFees } from '../hooks/use-edit-receipt';
import type { ReceiptWithRoom } from '../server/get-receipt-service';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet';
import { useIsMobile } from '@/shared/hooks/use-mobile';

type EditableFee = {
  localId: string;
  rawText: string | null;
  label: string;
  amount: string;
};

const toEditableFees = (receipt: ReceiptWithRoom): Array<EditableFee> =>
  receipt.fees.map((fee) => ({
    localId: fee.receiptFeeId,
    rawText: fee.rawText,
    label: fee.label,
    amount: fee.amount.toFixed(2),
  }));

const createEmptyFee = (): EditableFee => ({
  localId: crypto.randomUUID(),
  rawText: null,
  label: '',
  amount: '0.00',
});

export function EditFeesSheet({
  showSheet,
  receipt,
  closeSheet,
}: {
  showSheet: boolean;
  receipt: ReceiptWithRoom;
  closeSheet: () => void;
}) {
  const isMobile = useIsMobile();
  const formKey = `${showSheet ? 'open' : 'closed'}:${receipt.receiptId}:${receipt.fees.map((fee) => `${fee.receiptFeeId}:${fee.amount}:${fee.label}`).join('|')}`;

  return (
    <Sheet open={showSheet} onOpenChange={(open) => !open && closeSheet()}>
      <SheetContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        side={isMobile ? 'bottom' : 'right'}
        className={`${isMobile ? 'rounded-t-2xl' : 'rounded-l-2xl'} max-h-[90vh] p-6`}
      >
        <SheetHeader className="p-0">
          <SheetTitle className="text-xl">Edit Fees</SheetTitle>
          <SheetDescription>Manage extra charges</SheetDescription>
        </SheetHeader>

        <EditFeesForm key={formKey} receipt={receipt} closeSheet={closeSheet} />
      </SheetContent>
    </Sheet>
  );
}

function EditFeesForm({
  receipt,
  closeSheet,
}: {
  receipt: ReceiptWithRoom;
  closeSheet: () => void;
}) {
  const { mutateAsync: saveFees, isPending } = useUpdateReceiptFees(
    receipt.roomId ?? null,
  );
  const [fees, setFees] = useState<Array<EditableFee>>(() =>
    toEditableFees(receipt),
  );

  const totalFees = useMemo(
    () =>
      fees.reduce((sum, fee) => {
        const amount = parseFloat(fee.amount);
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0),
    [fees],
  );

  const hasInvalidFee = fees.some(
    (fee) =>
      fee.label.trim().length === 0 || !Number.isFinite(Number(fee.amount)),
  );

  const updateFee = (
    localId: string,
    field: 'label' | 'amount',
    value: string,
  ) => {
    setFees((currentFees) =>
      currentFees.map((fee) =>
        fee.localId === localId ? { ...fee, [field]: value } : fee,
      ),
    );
  };

  const deleteFee = (localId: string) => {
    setFees((currentFees) =>
      currentFees.filter((fee) => fee.localId !== localId),
    );
  };

  const handleSave = async () => {
    if (hasInvalidFee) return;

    await saveFees({
      receiptId: receipt.receiptId,
      fees: fees.map((fee) => ({
        rawText: fee.rawText,
        label: fee.label.trim(),
        amount: Number(fee.amount),
      })),
    });
    closeSheet();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
        {fees.map((fee) => (
          <div
            key={fee.localId}
            className="grid grid-cols-[1fr_112px_44px] items-end gap-2"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Fee Name
              </Label>
              <Input
                value={fee.label}
                onChange={(event) =>
                  updateFee(fee.localId, 'label', event.target.value)
                }
                placeholder="Service charge"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={fee.amount}
                  onChange={(event) =>
                    updateFee(fee.localId, 'amount', event.target.value)
                  }
                  onBlur={(event) => {
                    if (event.target.value === '') {
                      updateFee(fee.localId, 'amount', '0.00');
                      return;
                    }
                    updateFee(
                      fee.localId,
                      'amount',
                      Number(event.target.value).toFixed(2),
                    );
                  }}
                  className="h-11 pl-7 tabular-nums"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => deleteFee(fee.localId)}
              aria-label={`Delete ${fee.label || 'fee'}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() =>
            setFees((currentFees) => [...currentFees, createEmptyFee()])
          }
        >
          <Plus className="h-4 w-4" />
          Add Custom Fee
        </Button>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Total Fees
          </span>
          <span className="text-xl font-bold tabular-nums text-primary">
            ${totalFees.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={closeSheet}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1"
          onClick={handleSave}
          disabled={isPending || hasInvalidFee}
        >
          {isPending ? <Loader2 className="animate-spin" /> : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
