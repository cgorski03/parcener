import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Loader2, Users, Wallet, CheckCircle2, Coins } from "lucide-react";
import { PaymentMethodDto } from "@/server/dtos";
import { Separator } from "@/components/ui/separator";

interface CreateRoomSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (sharePayment: boolean) => void;
    isCreating: boolean;
    defaultPaymentMethod?: PaymentMethodDto;
    receiptTip: number;
}

export function CreateRoomSheet({
    open,
    onOpenChange,
    onConfirm,
    isCreating,
    defaultPaymentMethod,
    receiptTip
}: CreateRoomSheetProps) {
    const hasMethod = !!defaultPaymentMethod;
    const [sharePayment, setSharePayment] = useState(hasMethod);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="rounded-t-[20px] p-6 max-h-[90vh] flex flex-col">
                <SheetHeader className="text-left pb-2 space-y-1">
                    <SheetTitle>Create Room</SheetTitle>
                    <SheetDescription>
                        Review details before inviting friends.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-6">

                    {/* 1. TIP WARNING (High Contrast Style) */}
                    {receiptTip === 0 && (
                        <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4">
                            <div className="flex gap-4 items-start">
                                {/* Icon Bubble */}
                                <div className="bg-orange-100 dark:bg-orange-500/20 p-2.5 rounded-full shrink-0 text-orange-600 dark:text-orange-400">
                                    <Coins className="size-5" />
                                </div>

                                <div className="space-y-1 pt-0.5">
                                    <h4 className="text-sm font-semibold text-foreground">
                                        No Tip Added
                                    </h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        The receipt total doesn't include a tip. Ensure this is correct before creating the room.
                                    </p>
                                    <button
                                        onClick={() => onOpenChange(false)}
                                        className="text-xs font-medium text-orange-600 dark:text-orange-400 underline decoration-orange-600/30 hover:text-orange-700 mt-2 block"
                                    >
                                        Go back to add tip
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. PAYMENT SETTINGS */}
                    <div className="space-y-3">
                        <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
                            {/* Toggle Section */}
                            <div className="p-4 flex gap-4 items-start">
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-sm text-foreground">
                                            Share Your Payment Method
                                        </h4>
                                        {defaultPaymentMethod && (
                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground capitalize border">
                                                {defaultPaymentMethod.type}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed pr-4">
                                        {hasMethod
                                            ? "Link your guests directly to your payment method."
                                            : "No payment methods found in your account."}
                                    </p>
                                </div>
                                <Switch
                                    checked={sharePayment}
                                    onCheckedChange={setSharePayment}
                                    disabled={!hasMethod}
                                    className="mt-0.5 shrink-0"
                                />
                            </div>

                            <Separator />

                            {/* Status Footer */}
                            <div className={`
                                px-4 py-3 text-xs transition-colors duration-200
                                ${sharePayment
                                    ? "bg-primary/5 text-foreground/80"
                                    : "bg-muted/40 text-muted-foreground"}
                            `}>
                                <div className="flex gap-3 items-center">
                                    {sharePayment ? (
                                        <>
                                            <CheckCircle2 className="size-4 shrink-0 text-primary" />
                                            <span>
                                                Guests will pay <strong className="text-foreground">@{defaultPaymentMethod?.handle}</strong>
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Wallet className="size-4 shrink-0 opacity-50" />
                                            <span>
                                                Manual settlement (no link shared).
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <SheetFooter className="flex-row px-0 gap-3 mt-4">
                    <Button
                        onClick={() => onConfirm(sharePayment)}
                        disabled={isCreating}
                        className="h-12 flex-[2]  shadow-sm text-white bg-primary hover:bg-primary/90"
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
