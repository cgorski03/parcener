import { useMemo, useState } from 'react';
import { ReceiptSummarySheet } from './receipt-summary-sheet';
import type { ReceiptWithRoom } from '../server/get-receipt-service';
import { PriceBreakdown } from '@/shared/components/price-breakdown';
import { moneyValuesEqual } from '@/shared/lib/money-math';

interface ReceiptTotalsPanelProps {
  receipt: ReceiptWithRoom;
  className?: string;
}

export function ReceiptTotalsPanel({
  receipt,
  className,
}: ReceiptTotalsPanelProps) {
  const [showSummarySheet, setShowSummarySheet] = useState(false);

  const subtotal = useMemo(() => {
    return receipt.items.reduce((sum, item) => sum + item.price, 0).toFixed(2);
  }, [receipt.items]);

  const totalHasError = useMemo(() => {
    const calculated = Number(subtotal) + receipt.tip + receipt.tax;
    return !moneyValuesEqual(calculated, receipt.grandTotal);
  }, [subtotal, receipt]);

  return (
    <>
      <PriceBreakdown
        subtotal={parseFloat(subtotal)}
        tax={receipt.tax}
        tip={receipt.tip}
        grandTotal={receipt.grandTotal}
        label="Receipt Totals"
        onClick={() => setShowSummarySheet(true)}
        errorMessage={
          totalHasError ? 'Fix total mismatch before continuing' : undefined
        }
        className={className}
      />

      <ReceiptSummarySheet
        showSheet={showSummarySheet}
        receipt={receipt}
        subtotal={subtotal}
        closeSheet={() => setShowSummarySheet(false)}
      />
    </>
  );
}
