import { useMemo, useState } from 'react';
import { Pencil, Share2, Users } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ReceiptSummarySheet } from './receipt-summary-sheet';
import { CreateRoomSheet } from './create-room-sheet';
import type { ReceiptWithRoom } from '../server/get-receipt-service';
import { PriceBreakdown } from '@/shared/components/price-breakdown';
import { Button } from '@/shared/components/ui/button';
import { moneyValuesEqual } from '@/shared/lib/money-math';
import { useCreateReceiptRoom } from '@/features/room/hooks/use-room';

interface ReceiptActionsPanelProps {
  receipt: ReceiptWithRoom;
  receiptNotValid: boolean;
  className?: string;
}

export function ReceiptActionsPanel({
  receipt,
  receiptNotValid,
  className,
}: ReceiptActionsPanelProps) {
  const navigate = useNavigate();
  const [showSummarySheet, setShowSummarySheet] = useState(false);
  const [showCreateRoomSheet, setShowCreateRoomSheet] = useState(false);
  const { mutateAsync: createReceiptRoom, isPending: isCreatingRoom } =
    useCreateReceiptRoom();

  const subtotal = useMemo(() => {
    return receipt.items.reduce((sum, item) => sum + item.price, 0).toFixed(2);
  }, [receipt.items]);

  const totalHasError = useMemo(() => {
    const calculated = Number(subtotal) + receipt.tip + receipt.tax;
    return !moneyValuesEqual(calculated, receipt.grandTotal);
  }, [subtotal, receipt]);

  const handleFinalizeRoomCreation = async (sharePayment: boolean) => {
    const response = await createReceiptRoom({
      receiptId: receipt.receiptId,
      sharePayment,
    });

    if ('success' in response && 'room' in response) {
      setShowCreateRoomSheet(false);
      navigate({
        to: '/receipt/parce/$roomId',
        params: { roomId: response.room.roomId },
        search: { view: 'items' },
      });
    }
  };

  const ActionButton = () => {
    if (totalHasError) {
      return (
        <Button
          className="w-full h-11"
          size="lg"
          onClick={() => setShowSummarySheet(true)}
        >
          <Pencil className="size-4 mr-2" />
          Edit Receipt Totals
        </Button>
      );
    }

    if (receipt.roomId) {
      return (
        <Link
          to="/receipt/parce/$roomId"
          params={{ roomId: receipt.roomId }}
          search={{ view: 'items' }}
        >
          <Button className="w-full h-11" size="lg">
            <Users className="size-4 mr-2" />
            Go To Room
          </Button>
        </Link>
      );
    }

    return (
      <Button
        className="w-full h-11"
        size="lg"
        disabled={receiptNotValid}
        onClick={() => setShowCreateRoomSheet(true)}
      >
        <Share2 className="size-4 mr-2" />
        Create Room
      </Button>
    );
  };

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
        actionButton={<ActionButton />}
        className={className}
      />

      <ReceiptSummarySheet
        showSheet={showSummarySheet}
        receipt={receipt}
        subtotal={subtotal}
        closeSheet={() => setShowSummarySheet(false)}
      />

      <CreateRoomSheet
        open={showCreateRoomSheet}
        onOpenChange={setShowCreateRoomSheet}
        onConfirm={handleFinalizeRoomCreation}
        receiptTip={receipt.tip}
        isCreating={isCreatingRoom}
      />
    </>
  );
}
