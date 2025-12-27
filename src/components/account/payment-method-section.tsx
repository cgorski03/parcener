import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CreditCard,
    ExternalLink,
    Plus,
    Trash2,
    Wallet,
} from "lucide-react";
import { PaymentMethodDto, PaymentMethodType } from "@/server/dtos";
import {
    usePaymentMethods,
    useDeletePaymentMethod
} from "@/hooks/use-payment-methods";
import { AddPaymentMethodSheet } from "./add-payment-method-sheet";

const SUPPORTED_METHODS: PaymentMethodType[] = ["venmo"];

export function PaymentMethodsSection() {
    const { data: paymentMethods = [], isLoading } = usePaymentMethods();
    const { mutate: deleteMethod } = useDeletePaymentMethod();

    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Logic: Check which supported methods are already linked
    // We cast `pm.type` to ensure TS knows it matches the union
    const linkedTypes = paymentMethods.map(pm => pm.type as PaymentMethodType);

    const availableMethods = SUPPORTED_METHODS.filter(
        type => !linkedTypes.includes(type)
    );

    const canAddMore = availableMethods.length > 0;

    const handleRemove = (id: string) => {
        if (confirm("Are you sure you want to remove this payment method?")) {
            deleteMethod(id);
        }
    };

    if (isLoading) {
        return <PaymentMethodsSkeleton />;
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between pl-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Payment Methods
                </h3>
            </div>

            <Card className="py-0 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    {/* LIST OF LINKED METHODS */}
                    <div className="p-4 space-y-3">
                        {paymentMethods.length > 0 ? (
                            <div className="space-y-3">
                                {paymentMethods.map((method) => (
                                    <PaymentMethodItem
                                        key={method.paymentMethodId}
                                        method={method}
                                        onRemove={() => handleRemove(method.paymentMethodId)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
                                <div className="bg-muted/50 p-3 rounded-full">
                                    <Wallet className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">No payment methods</p>
                                    <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                                        Link an account so friends can easily pay you back.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* FOOTER SECTION */}
                    {(canAddMore || paymentMethods.length > 0) && (
                        <div className="bg-muted/20 flex flex-col gap-4 p-4 border-t">

                            {canAddMore && (
                                <Button
                                    size="sm"
                                    variant={paymentMethods.length > 0 ? "outline" : "default"}
                                    className={`w-full text-xs shadow-sm ${paymentMethods.length === 0
                                        ? "bg-[#3d95ce] hover:bg-[#3d95ce]/90 text-white"
                                        : ""
                                        }`}
                                    onClick={() => setIsSheetOpen(true)}
                                >
                                    <Plus className="mr-2 h-3.5 w-3.5" />
                                    {paymentMethods.length > 0
                                        ? "Add Another Method"
                                        : "Link Venmo Account"}
                                </Button>
                            )}

                            {paymentMethods.length > 0 && (
                                <div className="flex items-center gap-3 px-1">
                                    <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0">
                                        <CreditCard className="h-4 w-4" />
                                    </div>
                                    <div className="text-[11px] text-muted-foreground leading-snug flex-1">
                                        Your default method is used when friends pay you back - if you choose to share it when creating a room.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AddPaymentMethodSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                isFirstMethod={paymentMethods.length === 0}
            />
        </div>
    );
}

function PaymentMethodItem({
    method,
    onRemove,
}: {
    method: PaymentMethodDto;
    onRemove: () => void;
}) {
    return (
        <div className="group flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
            <div className="flex items-center gap-3 overflow-hidden">
                <div
                    className={`
                    flex h-9 w-9 shrink-0 items-center justify-center rounded-md border
                    ${method.type === "venmo"
                            ? "bg-[#3d95ce]/10 text-[#3d95ce] border-[#3d95ce]/20"
                            : "bg-muted"
                        }
                `}
                >
                    {method.type === "venmo" ? (
                        <span className="font-bold text-xs uppercase">V</span>
                    ) : (
                        <span className="uppercase text-xs">{method.type[0]}</span>
                    )}
                </div>

                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate capitalize">
                            {method.type}
                        </span>
                        {method.isDefault && (
                            <Badge
                                variant="secondary"
                                className="text-[10px] h-4 px-1.5 font-normal"
                            >
                                Default
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                        <span className="truncate">@{method.handle}</span>
                        <ExternalLink className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                    </div>
                </div>
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={onRemove}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}

function PaymentMethodsSkeleton() {
    return (
        <div className="space-y-2 animate-pulse">
            <div className="h-4 w-24 bg-muted rounded ml-1" />
            <Card className="h-32 w-full bg-card" />
        </div>
    );
}
