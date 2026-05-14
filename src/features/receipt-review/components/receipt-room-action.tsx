import { useMemo, useState } from 'react';
import { Pencil, Share2, Users } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { CreateRoomSheet } from './create-room-sheet';
import { ReceiptSummarySheet } from './receipt-summary-sheet';
import type { ReceiptWithRoom } from '../server/get-receipt-service';
import { Button } from '@/shared/components/ui/button';
import { moneyValuesEqual } from '@/shared/lib/money-math';
import { useCreateReceiptRoom } from '@/features/room/hooks/use-room';

interface ReceiptRoomActionProps {
  receipt: ReceiptWithRoom;
  receiptNotValid: boolean;
}

export function ReceiptRoomAction({
  receipt,
  receiptNotValid,
}: ReceiptRoomActionProps) {
  const navigate = useNavigate();
  const [showSummarySheet, setShowSummarySheet] = useState(false);
  const [showCreateRoomSheet, setShowCreateRoomSheet] = useState(false);
  const { mutateAsync: createReceiptRoom, isPending: isCreatingRoom } =
    useCreateReceiptRoom();

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

  return (
    <>
      {totalHasError ? (
        <Button
          className="w-full h-11"
          size="lg"
          onClick={() => setShowSummarySheet(true)}
        >
          <Pencil className="size-4 mr-2" />
          Edit Receipt Totals
        </Button>
      ) : receipt.roomId ? (
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
      ) : (
        <Button
          className="w-full h-11"
          size="lg"
          disabled={receiptNotValid}
          onClick={() => setShowCreateRoomSheet(true)}
        >
          <Share2 className="size-4 mr-2" />
          Create Room
        </Button>
      )}

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
