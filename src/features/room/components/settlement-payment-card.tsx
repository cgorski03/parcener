import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash,
  Wallet,
  Plus,
} from 'lucide-react';
import { VenmoButton } from './venmo-button';
import { Link } from '@tanstack/react-router';
import { useGetRoomPulse, useUpdateRoomPaymentMethod } from '../hooks/use-room';
import { useQuery } from '@tanstack/react-query';
import { paymentMethodsOptions } from '@/features/payment-methods/hooks/use-payment-methods';

interface SettlementPaymentCardProps {
  roomId: string;
  isHost: boolean;
  myTotalOwed: number;
}

export function SettlementPaymentCard({
  roomId,
  isHost,
  myTotalOwed,
}: SettlementPaymentCardProps) {
  const { data: room } = useGetRoomPulse(roomId);
  // We pass the isHost to  prevent unauthed users from calling a protected function
  const { data: myPaymentMethods } = useQuery(paymentMethodsOptions(isHost));
  const {
    mutate: updateRoomPayment,
    variables,
    isPending,
  } = useUpdateRoomPaymentMethod(roomId);

  if (!room) return null;
  if (myTotalOwed <= 0 && !isHost) return null;

  if (isHost) {
    const defaultMethod =
      myPaymentMethods?.find((pm) => pm.isDefault) || myPaymentMethods?.[0];

    const containerClasses =
      'p-4 shadow-sm min-h-[90px] flex flex-col justify-center';

    // --- CASE A: LINKED ---
    if (room.hostPaymentInformation) {
      const isUnlinking = isPending && variables === null;

      return (
        <Card
          className={`bg-primary/5 border-primary/20 relative ${containerClasses}`}
        >
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0 flex items-center justify-center">
                {isUnlinking ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <h4 className="font-semibold text-sm leading-none">
                  Collecting Payments
                </h4>
                <p className="text-xs text-muted-foreground leading-none">
                  Linked via{' '}
                  <span className="font-medium text-foreground">
                    {room.hostPaymentInformation.type}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium text-foreground">
                    @{room.hostPaymentInformation.handle}
                  </span>
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
              disabled={isPending}
              onClick={() => updateRoomPayment(null)}
            >
              <Trash className="size-4" />
            </Button>
          </div>
        </Card>
      );
    }

    // --- CASE B: MISSING INFO ---
    if (defaultMethod) {
      const isLinkingThis =
        isPending &&
        (variables as any)?.paymentMethodId === defaultMethod.paymentMethodId;

      return (
        <Card
          className={`border-dashed border-destructive/30 bg-destructive/5 ${containerClasses}`}
        >
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-destructive/10 p-2 rounded-full text-destructive shrink-0 flex items-center justify-center">
                <AlertCircle className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5">
                <h4 className="font-semibold text-sm text-destructive/90 leading-none">
                  Missing Payment Info
                </h4>
                <p className="text-xs text-muted-foreground leading-none">
                  Share details to collect payments.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="h-9 px-4 border-destructive/20 hover:bg-destructive/10 hover:text-destructive shrink-0 text-xs font-medium bg-background/50"
              disabled={isPending}
              onClick={() => updateRoomPayment(defaultMethod)}
            >
              {isLinkingThis ? (
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
              ) : (
                <Plus className="size-3.5 mr-1.5" />
              )}
              {isLinkingThis ? 'Sharing...' : `Share ${defaultMethod.type}`}
            </Button>
          </div>
        </Card>
      );
    }

    // CASE C: SETUP REQUIRED
    return (
      <Card className={`border-dashed bg-muted/20 ${containerClasses}`}>
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-background p-2 rounded-full border shadow-sm text-muted-foreground shrink-0 flex items-center justify-center">
              <Wallet className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h4 className="font-medium text-sm leading-none">
                Setup Payments
              </h4>
              <p className="text-xs text-muted-foreground leading-none">
                Link Venmo to settle up.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-9 text-xs shrink-0 bg-background/50"
          >
            <Link to="/account">Setup</Link>
          </Button>
        </div>
      </Card>
    );
  }

  // 3. Case: I am a GUEST
  if (room.hostPaymentInformation?.type === 'venmo') {
    return (
      <div className="space-y-2">
        <VenmoButton
          handle={room.hostPaymentInformation.handle}
          amount={myTotalOwed}
          note={`Parcener: ${room.title || 'Receipt Split'}`}
        />
        <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider font-medium">
          Paying Host: @{room.hostPaymentInformation.handle}
        </p>
      </div>
    );
  }

  return (
    <Card className="bg-muted/40 p-4 border-dashed flex flex-col items-center justify-center text-center gap-2 min-h-[90px]">
      <div className="p-2 rounded-full text-muted-foreground/30">
        <Wallet className="size-6" />
      </div>
      <div className="space-y-1">
        <h4 className="font-medium text-sm text-muted-foreground">
          Waiting on Host
        </h4>
        <p className="text-xs text-muted-foreground/70">
          Host hasn't shared payment details yet.
        </p>
      </div>
    </Card>
  );
}
