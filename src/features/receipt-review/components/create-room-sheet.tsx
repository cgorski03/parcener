import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Coins,
  Loader2,
  Users,
  Wallet,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/shared/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet';
import { Switch } from '@/shared/components/ui/switch';
import { Separator } from '@/shared/components/ui/separator';
import { useDefaultPaymentMethod } from '@/features/payment-methods/hooks/use-payment-methods';

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
  const { defaultPaymentMethod, isLoading: isLoadingPaymentMethods } = useDefaultPaymentMethod();
  const [sharePayment, setSharePayment] = useState(true);
  const hasMethod = !!defaultPaymentMethod;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[20px] p-6 max-h-[90vh] flex flex-col outline-none"
      >
        <SheetHeader className="text-left pb-2 space-y-1">
          <SheetTitle className="text-xl">Create Room</SheetTitle>
          <SheetDescription>
            Review details before inviting friends.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
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

          {/* 2. PAYMENT SETTINGS */}
          <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
            <div className="p-4 flex gap-4 items-center">
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">Share Payment Method</h4>
                  {defaultPaymentMethod && !isLoadingPaymentMethods && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground capitalize border">
                      {defaultPaymentMethod.type}
                    </span>
                  )}
                  {isLoadingPaymentMethods && (
                    <Loader2 className="size-3 animate-spin text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {defaultPaymentMethod && !isLoadingPaymentMethods
                    ? 'Link guests directly to your account.'
                    : isLoadingPaymentMethods
                      ? 'Loading payment methods...'
                      : "You haven't linked a payment account yet."}
                </p>
              </div>
              <Switch
                className="scale-150 data-[state=checked]:bg-[#3d95ce]"
                checked={sharePayment && hasMethod && !isLoadingPaymentMethods}
                onCheckedChange={setSharePayment}
                disabled={!hasMethod || isLoadingPaymentMethods}
              />
            </div>

            <Separator />

            <div
              className={`px-4 py-3 text-xs transition-colors duration-200 ${
                sharePayment && defaultPaymentMethod && !isLoadingPaymentMethods
                  ? 'bg-primary/5 text-foreground/80'
                  : 'bg-muted/40 text-muted-foreground'
              }`}
            >
              {isLoadingPaymentMethods ? (
                <div className="flex gap-3 items-center h-8">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  <span>Loading payment options...</span>
                </div>
              ) : defaultPaymentMethod ? (
                <div className="flex gap-3 items-center h-8">
                  {sharePayment ? (
                    <>
                      <CheckCircle2 className="size-4 shrink-0 text-primary" />
                      <span>
                        Guests will pay{' '}
                        <strong className="text-foreground">
                          @{defaultPaymentMethod.handle}
                        </strong>
                      </span>
                    </>
                  ) : (
                    <>
                      <Wallet className="size-4 shrink-0 opacity-50" />
                      <span>Manual settlement (no link shared).</span>
                    </>
                  )}
                </div>
              ) : (
                /* NO METHOD FOUND - ACTION BUTTON */
                <div className="flex items-center justify-between gap-3 h-8">
                  <div className="flex items-center gap-2">
                    <Wallet className="size-4 shrink-0 opacity-50" />
                    <span>Manual settlement only.</span>
                  </div>
                  <Button
                    asChild
                    variant="link"
                    className="h-auto p-0 text-primary text-xs font-semibold"
                  >
                    <Link to="/account">
                      Link Venmo <ArrowRight className="ml-1 size-3" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row gap-3 mt-4">
          <Button
            onClick={() => onConfirm(sharePayment && hasMethod && !isLoadingPaymentMethods)}
            disabled={isCreating || isLoadingPaymentMethods}
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
