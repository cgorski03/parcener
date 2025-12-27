import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { useCreatePaymentMethod } from "@/hooks/use-payment-methods";
import { cn } from "@/lib/utils";

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
    const [handle, setHandle] = useState("");
    const [hasVerified, setHasVerified] = useState(false);

    const cleanHandle = handle.replace("@", "").trim();
    const showVerifyUI = cleanHandle.length > 2;

    const handleSave = () => {
        if (!cleanHandle) return;

        createMethod(
            {
                type: "venmo",
                handle: cleanHandle,
                isDefault: isFirstMethod,
            },
            {
                onSuccess: () => {
                    setHandle("");
                    setHasVerified(false);
                    onOpenChange(false);
                },
            }
        );
    };

    const handleVerifyClick = () => {
        if (!cleanHandle) return;
        window.open(`https://venmo.com/${cleanHandle}`, "_blank");
        setHasVerified(true);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="rounded-t-[20px] max-h-[90vh] flex flex-col p-6 gap-6 outline-none"
            >
                <SheetHeader className="text-left space-y-1">
                    <SheetTitle>Link Venmo Account</SheetTitle>
                    <SheetDescription>
                        Adding your Venmo handle allows friends to pay you back instantly.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 flex flex-col gap-6">
                    {/* Step 1: Input */}
                    <div className="space-y-3">
                        <Label htmlFor="venmo-handle">Venmo Username</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base">
                                @
                            </span>
                            <Input
                                id="venmo-handle"
                                placeholder="username"
                                // We explicitly match height (h-12) and text size (text-base) to the button below
                                className="pl-7 h-12 text-base"
                                value={handle}
                                onChange={(e) => {
                                    setHandle(e.target.value);
                                    setHasVerified(false);
                                }}
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-muted-foreground px-1">
                            You can find this in the "Me" tab of your Venmo app.
                        </p>
                    </div>

                    {/* Step 2: Verification */}
                    <div className="min-h-[140px]">
                        <div
                            className={cn(
                                "rounded-xl border bg-muted/30 p-4 space-y-4 transition-all duration-300 ease-in-out",
                                showVerifyUI
                                    ? "opacity-100 translate-y-0"
                                    : "opacity-0 translate-y-2 pointer-events-none"
                            )}
                        >
                            <div className="flex gap-3 items-start">
                                <div className="bg-[#3d95ce]/10 p-2 rounded-full h-fit text-[#3d95ce] shrink-0">
                                    <AlertCircle className="size-4" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold text-foreground">Verify your profile</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Tap the button below to open Venmo and confirm this is the correct account.
                                    </p>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                // Explicitly passing h-12 to guarantee size regardless of variant issues
                                className="w-full justify-between bg-background h-12 text-base"
                                onClick={handleVerifyClick}
                                tabIndex={showVerifyUI ? 0 : -1}
                            >
                                <span className="truncate">Check @{cleanHandle}</span>
                                <ExternalLink className="size-4 text-muted-foreground" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Custom Footer layout to ensure correct mobile stacking */}
                <div className="mt-auto flex flex-col-reverse gap-3 pt-2">
                    <Button
                        variant="ghost"
                        // Explicit h-12 and text-base for consistency
                        className="h-12 text-base w-full text-muted-foreground"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>

                    <Button
                        // Force h-12 and text-base to match Input visual weight
                        className="h-12 text-base w-full bg-[#3d95ce] hover:bg-[#3d95ce]/90 text-white shadow-md"
                        onClick={handleSave}
                        disabled={!cleanHandle || isPending || !hasVerified}
                    >
                        {isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : hasVerified ? (
                            <>
                                <CheckCircle2 className="size-4 mr-2" />
                                Confirm & Save
                            </>
                        ) : (
                            "Verify First"
                        )}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
