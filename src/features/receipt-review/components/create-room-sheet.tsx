import { Suspense, useState } from 'react';
import { Coins, Loader2, Users } from 'lucide-react';
import {
  PaymentSettings,
  PaymentSettingsSkeleton,
} from './room-payment-settings';
import { Button } from '@/shared/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet';

interface CreateRoomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (sharePayment: boolean) => void;
  isCreating: boolean;
  receiptTip: number;
}

export function CreateRoomSheet({
  open,
  onOpenChange,
  onConfirm,
  isCreating,
  receiptTip,
}: CreateRoomSheetProps) {
  // We keep the *preference* state here, but the data fetching is pushed down
  const [sharePayment, setSharePayment] = useState(true);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[20px] p-6 max-h-[90vh] flex flex-col outline-none"
      >
        <SheetHeader className="text-left p-0 space-y-1">
          <SheetTitle className="text-xl">Create Room</SheetTitle>
          <SheetDescription>
            Review details before inviting friends.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pt-4">
          {/* 1. TIP WARNING */}
          {receiptTip === 0 && (
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 flex gap-4 items-center">
              <div className="bg-orange-100 dark:bg-orange-500/20 p-2 rounded-full shrink-0 text-orange-600 dark:text-orange-400">
                <Coins className="size-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No tip detected. Ensure this is correct or{' '}
                  <button
                    onClick={() => onOpenChange(false)}
                    className="font-medium text-orange-600 dark:text-orange-400 underline decoration-orange-600/30"
                  >
                    go back to add one.
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* 2. PAYMENT CONFIGURATION  */}
          <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
            <Suspense fallback={<PaymentSettingsSkeleton />}>
              <PaymentSettings
                isEnabled={sharePayment}
                onToggle={setSharePayment}
              />
            </Suspense>
          </div>
        </div>

        <SheetFooter className="flex-row p-0 gap-3 mt-4">
          <Button
            onClick={() => onConfirm(sharePayment)}
            disabled={isCreating}
            className="h-12 flex-[2] text-white bg-primary hover:bg-primary/90"
          >
            {isCreating ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Users className="mr-2 size-4" />
            )}
            Create Room
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
