import { useMemo, useState } from 'react';
import { EditFeesSheet } from './edit-fees-sheet';
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
  const [showFeesSheet, setShowFeesSheet] = useState(false);

  const subtotal = useMemo(() => {
    return receipt.items.reduce((sum, item) => sum + item.price, 0).toFixed(2);
  }, [receipt.items]);

  const feesTotal = useMemo(() => {
    return receipt.fees.reduce((sum, fee) => sum + fee.amount, 0);
  }, [receipt.fees]);

  const totalHasError = useMemo(() => {
    const calculated = Number(subtotal) + receipt.tip + receipt.tax + feesTotal;
    return !moneyValuesEqual(calculated, receipt.grandTotal);
  }, [feesTotal, receipt, subtotal]);

  return (
    <>
      <PriceBreakdown
        subtotal={parseFloat(subtotal)}
        tax={receipt.tax}
        tip={receipt.tip}
        grandTotal={receipt.grandTotal}
        fees={receipt.fees.map((fee) => ({
          id: fee.receiptFeeId,
          label: fee.label,
          amount: fee.amount,
        }))}
        label="Receipt Totals"
        onClick={() => setShowSummarySheet(true)}
        onFeesClick={() => setShowFeesSheet(true)}
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

      <EditFeesSheet
        showSheet={showFeesSheet}
        receipt={receipt}
        closeSheet={() => setShowFeesSheet(false)}
      />
    </>
  );
}
