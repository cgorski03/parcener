import { Link } from '@tanstack/react-router';
import { ArrowRight, CheckCircle2, Wallet } from 'lucide-react';
import { Switch } from '@/shared/components/ui/switch';
import { Separator } from '@/shared/components/ui/separator';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { usePaymentMethodsSuspense } from '@/features/payment-methods/hooks/use-payment-methods';

interface PaymentSettingsProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function PaymentSettings({ isEnabled, onToggle }: PaymentSettingsProps) {
  const { defaultPaymentMethod } = usePaymentMethodsSuspense();

  const hasMethod = !!defaultPaymentMethod;
  const isSharing = isEnabled && hasMethod;

  return (
    <>
      {/* Top Section: Toggle */}
      <div className="p-4 flex gap-4 items-center">
        <div className="flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">Share Payment Method</h4>
            {hasMethod && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground capitalize border">
                {defaultPaymentMethod.type}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {hasMethod
              ? 'Link guests directly to your account.'
              : "You haven't linked a payment account yet."}
          </p>
        </div>
        <Switch
          className="scale-125 data-[state=checked]:bg-[#3d95ce]"
          checked={isSharing}
          onCheckedChange={onToggle}
          disabled={!hasMethod}
        />
      </div>

      <Separator />

      {/* Bottom Section: Status Bar */}
      <div
        className={cn(
          'px-4 py-3 text-xs transition-colors duration-200 min-h-[40px] flex items-center',
          isSharing
            ? 'bg-primary/5 text-foreground/80'
            : 'bg-muted/40 text-muted-foreground',
        )}
      >
        {hasMethod ? (
          <PaymentActiveView
            isSharing={isSharing}
            handle={defaultPaymentMethod.handle}
          />
        ) : (
          <PaymentMissingView />
        )}
      </div>
    </>
  );
}

function PaymentActiveView({
  isSharing,
  handle,
}: {
  isSharing: boolean;
  handle: string;
}) {
  if (!isSharing) {
    return (
      <div className="flex gap-3 items-center">
        <Wallet className="size-4 shrink-0 opacity-50" />
        <span>Manual settlement (no link shared).</span>
      </div>
    );
  }
  return (
    <div className="flex gap-3 items-center">
      <CheckCircle2 className="size-4 shrink-0 text-primary" />
      <span>
        Guests will pay <strong className="text-foreground">@{handle}</strong>
      </span>
    </div>
  );
}

function PaymentMissingView() {
  return (
    <div className="flex items-center justify-between w-full gap-3">
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
  );
}

export function PaymentSettingsSkeleton() {
  return (
    <div className="w-full">
      <div className="p-4 flex gap-4 items-center">
        <div className="flex-1 space-y-2">
          {/* Title Skeleton */}
          <div className="h-4 w-32 bg-muted/60 animate-pulse rounded" />
          {/* Subtitle Skeleton */}
          <div className="h-3 w-48 bg-muted/40 animate-pulse rounded" />
        </div>
        {/* Switch Skeleton */}
        <div className="h-6 w-10 bg-muted/60 animate-pulse rounded-full" />
      </div>

      <Separator />

      {/* Bottom Bar Skeleton */}
      <div className="px-4 py-3 bg-muted/20">
        <div className="flex gap-3 items-center">
          <div className="size-4 rounded-full bg-muted/60 animate-pulse" />
          <div className="h-3 w-40 bg-muted/60 animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}
