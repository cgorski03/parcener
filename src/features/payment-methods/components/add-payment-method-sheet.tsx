import { useState, useRef, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet';
import { Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useCreatePaymentMethod } from '../hooks/use-payment-methods';

interface AddPaymentMethodSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isFirstMethod: boolean;
}

export function AddPaymentMethodSheet({
  open,
  onOpenChange,
  isFirstMethod,
}: AddPaymentMethodSheetProps) {
  const { mutate: createMethod, isPending } = useCreatePaymentMethod();
  const [handle, setHandle] = useState('');
  const [hasVerified, setHasVerified] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Delay rendering the input until sheet animation is done
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
    }
  }, [open]);

  const cleanHandle = handle.replace('@', '').trim();
  const showVerifyUI = cleanHandle.length > 2;

  const handleSave = () => {
    if (!cleanHandle) return;
    createMethod(
      { type: 'venmo', handle: cleanHandle, isDefault: isFirstMethod },
      {
        onSuccess: () => {
          setHandle('');
          setHasVerified(false);
          onOpenChange(false);
        },
      },
    );
  };

  const handleVerifyClick = () => {
    if (!cleanHandle) return;
    window.open(`https://venmo.com/${cleanHandle}`, '_blank');
    setHasVerified(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="rounded-t-[20px] max-h-[92svh] flex flex-col p-6 gap-6 outline-none"
      >
        <SheetHeader className="text-left space-y-1">
          <SheetTitle>Link Venmo Account</SheetTitle>
          <SheetDescription>
            Adding your Venmo handle allows friends to pay you back instantly.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col gap-6">
          <div className="space-y-3">
            <Label htmlFor="venmo-handle">Venmo Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base">
                @
              </span>
              {isReady ? (
                <Input
                  ref={inputRef}
                  id="venmo-handle"
                  placeholder="username"
                  className="pl-7 h-12 text-base"
                  inputMode="text"
                  autoComplete="off"
                  value={handle}
                  onChange={(e) => {
                    setHandle(e.target.value);
                    setHasVerified(false);
                  }}
                />
              ) : (
                <div className="h-12 w-full rounded-md border bg-muted/30 pl-7 flex items-center text-muted-foreground text-base">
                  username
                </div>
              )}
            </div>
          </div>

          <div className="min-h-[140px]">
            <div
              className={cn(
                'rounded-xl border bg-muted/30 p-4 space-y-4 transition-all duration-300',
                showVerifyUI ? 'opacity-100' : 'opacity-0 pointer-events-none',
              )}
            >
              <div className="flex gap-3 items-start">
                <div className="bg-[#3d95ce]/10 p-2 rounded-full h-fit text-[#3d95ce] shrink-0">
                  <AlertCircle className="size-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Verify your profile</h4>
                  <p className="text-xs text-muted-foreground">
                    Tap below to confirm the account is correct.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full justify-between bg-background h-12"
                onClick={handleVerifyClick}
              >
                <span className="truncate">Check @{cleanHandle}</span>
                <ExternalLink className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-col-reverse gap-3">
          <Button
            className="h-12 text-base w-full bg-[#3d95ce] text-white"
            onClick={handleSave}
            disabled={!cleanHandle || isPending || !hasVerified}
          >
            {isPending ? (
              <Loader2 className="animate-spin" />
            ) : hasVerified ? (
              'Confirm & Save'
            ) : (
              'Verify First'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
