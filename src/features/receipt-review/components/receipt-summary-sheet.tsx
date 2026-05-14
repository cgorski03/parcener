import { useState } from 'react';
import { Label } from '@radix-ui/react-label';
import { Loader2 } from 'lucide-react';
import { useFinalizeReceipt } from '../hooks/use-edit-receipt';
import type { ReceiptWithRoom } from '../server/get-receipt-service';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { useIsMobile } from '@/shared/hooks/use-mobile';

const calculateAmount = (
  inputValue: string,
  mode: 'percentage' | 'absolute',
  subtotal: number,
): number => {
  if (inputValue === '') return 0;
  const value = parseFloat(inputValue);
  if (mode === 'percentage') {
    return (subtotal * value) / 100;
  }
  return value;
};

type TipTaxMode = 'percentage' | 'absolute';

export function ReceiptSummarySheet(props: {
  showSheet: boolean;
  subtotal: string;
  receipt: ReceiptWithRoom;
  closeSheet: () => void;
}) {
  const { showSheet, receipt, subtotal, closeSheet } = props;
  const { mutateAsync: saveReceiptTotal, isPending: savingReceiptTotal } =
    useFinalizeReceipt(receipt.roomId ?? null);
  const isMobile = useIsMobile();

  const [taxMode, setTaxMode] = useState<TipTaxMode>('absolute');
  const [tipMode, setTipMode] = useState<TipTaxMode>('absolute');

  const handleSetTaxMode = (mode: TipTaxMode) => {
    // I want to handle actually converting the persons value to the other type
    if (mode === 'percentage') {
      // Person wants to convert to percentage from absolute value
      // Basically, what was the percentage before?
      const percentage = (taxAmount / subtotalFloat) * 100;
      setTaxInputValue(percentage.toFixed(2));
      setTaxMode('percentage');
    } else {
      const absolute = (subtotalFloat * parseFloat(taxInputValue)) / 100;
      setTaxInputValue(absolute.toFixed(2));
      setTaxMode('absolute');
    }
  };
  const handleSetTipMode = (mode: TipTaxMode) => {
    // I want to handle actually converting the persons value to the other type
    if (mode === 'percentage') {
      // Person wants to convert to percentage from absolute value
      // Basically, what was the percentage before?
      const percentage = (tipAmount / subtotalFloat) * 100;
      setTipInputValue(percentage.toFixed(2));
      setTipMode('percentage');
    } else {
      const absolute = (subtotalFloat * parseFloat(tipInputValue)) / 100;
      setTipInputValue(absolute.toFixed(2));
      setTipMode('absolute');
    }
  };
  const [taxInputValue, setTaxInputValue] = useState<string>(
    receipt.tax.toFixed(2),
  );
  const [tipInputValue, setTipInputValue] = useState<string>(
    receipt.tip.toFixed(2),
  );
  const subtotalFloat = parseFloat(subtotal);
  const feesAmount = receipt.fees.reduce((sum, fee) => sum + fee.amount, 0);

  const taxAmount = calculateAmount(taxInputValue, taxMode, subtotalFloat);
  const tipAmount = calculateAmount(tipInputValue, tipMode, subtotalFloat);

  const grandTotal = subtotalFloat + taxAmount + tipAmount + feesAmount;
  const handleSaveReceiptTotals = async () => {
    await saveReceiptTotal({
      receiptId: receipt.receiptId,
      subtotal: subtotalFloat,
      tax: taxAmount,
      tip: tipAmount,
      grandTotal: grandTotal,
    });
    closeSheet();
  };

  return (
    <Sheet open={showSheet} onOpenChange={(open) => !open && closeSheet()}>
      <SheetContent
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
        side={isMobile ? 'bottom' : 'right'}
        className={`${isMobile ? 'rounded-t-2xl' : 'rounded-l-2xl'} p-6`}
      >
        <SheetHeader className="pl-0">
          <SheetTitle className="text-xl">Edit Totals</SheetTitle>
          <SheetDescription className="text-sm">
            Adjust tax and tip
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 ">
          {/* Subtotal - Locked */}
          <div className="p-4  bg-muted/50 rounded-xl border border-border">
            <div className="flex  items-center justify-between">
              <span className="text-base font-medium text-muted-foreground">
                Subtotal
              </span>
              <span className="text-2xl font-bold">${subtotal}</span>
            </div>
          </div>

          {/* Tax */}
          <div className="space-y-2">
            <Label className="text-base font-medium block">Tax</Label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-[20%] text-muted-foreground text-lg font-medium">
                  {taxMode === 'percentage' ? '%' : '$'}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  value={taxInputValue}
                  onChange={(e) => {
                    if (e.target.value === '') {
                      setTaxInputValue('');
                    } else {
                      setTaxInputValue(e.target.value);
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') setTaxInputValue('0');
                  }}
                  className="text-lg h-12 pl-8 pr-4"
                  placeholder="0.00"
                />
              </div>
              <div className="inline-flex rounded-lg bg-muted p-1">
                <button
                  type="button"
                  onClick={() => handleSetTaxMode('absolute')}
                  className={`text-lg font-medium rounded-md transition-all min-w-[48px] ${
                    taxMode === 'absolute'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  }`}
                >
                  $
                </button>
                <button
                  type="button"
                  onClick={() => handleSetTaxMode('percentage')}
                  className={`text-lg font-medium rounded-md transition-all min-w-[48px] ${
                    taxMode === 'percentage'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  }`}
                >
                  %
                </button>
              </div>
            </div>
          </div>

          {/* Tip */}
          <div className="space-y-2">
            <Label className="text-base font-medium block">Tip</Label>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-[20%] text-muted-foreground text-lg font-medium">
                  {tipMode === 'percentage' ? '%' : '$'}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  value={tipInputValue}
                  onChange={(e) => {
                    if (e.target.value === '') {
                      setTipInputValue('');
                    } else {
                      setTipInputValue(e.target.value);
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') setTipInputValue('0');
                  }}
                  className="text-lg h-12 pl-8 pr-4"
                  placeholder="0.00"
                />
              </div>
              <div className="inline-flex rounded-lg bg-muted p-1">
                <button
                  type="button"
                  onClick={() => handleSetTipMode('absolute')}
                  className={`text-lg font-medium rounded-md transition-all min-w-[48px] ${
                    tipMode === 'absolute'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  }`}
                >
                  $
                </button>
                <button
                  type="button"
                  onClick={() => handleSetTipMode('percentage')}
                  className={`text-lg font-medium rounded-md transition-all min-w-[48px] ${
                    tipMode === 'percentage'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  }`}
                >
                  %
                </button>
              </div>
            </div>
          </div>

          {/* Grand Total Preview */}
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
            <div className="text-sm text-muted-foreground space-y-1.5">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium">${subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="font-medium">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-3">
                <span>Tip</span>
                <span className="font-medium">${tipAmount.toFixed(2)}</span>
              </div>
              {receipt.fees.length > 0 && (
                <>
                  <div className="flex justify-between border-t border-dashed border-border pt-3 mb-2">
                    <span className="font-medium text-foreground">Fees</span>
                    <span className="font-medium text-foreground">
                      ${feesAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-1 pl-3 border-l border-dashed border-border/70">
                    {receipt.fees.map((fee) => (
                      <div key={fee.receiptFeeId} className="flex justify-between">
                        <span>{fee.label}</span>
                        <span>${fee.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center justify-between ">
              <span className="text-base font-medium">Grand Total</span>
              <span className="text-2xl font-bold text-primary">
                ${grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 h-12 text-base"
              onClick={closeSheet}
            >
              Cancel
            </Button>
            <Button
              size="lg"
              className="flex-1 h-12 text-base"
              onClick={handleSaveReceiptTotals}
            >
              {savingReceiptTotal ? (
                <Loader2 className="animate-spin" />
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
