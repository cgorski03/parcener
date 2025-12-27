import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    CreditCard,
    ExternalLink,
    Plus,
    Trash2,
    Wallet,
    Loader2,
    X
} from "lucide-react";
import { PaymentMethodDto } from "@/server/dtos";
import {
    usePaymentMethods,
    useCreatePaymentMethod,
    useDeletePaymentMethod
} from "@/hooks/use-payment-methods";

export function PaymentMethodsSection() {
    const { data: paymentMethods = [], isLoading } = usePaymentMethods();
    const { mutate: createMethod, isPending: isCreating } = useCreatePaymentMethod();
    const { mutate: deleteMethod } = useDeletePaymentMethod();

    const [isAdding, setIsAdding] = useState(false);
    const [handle, setHandle] = useState("");

    // ---------------------------------------------------------
    // HANDLERS
    // ---------------------------------------------------------
    const handleAddVenmo = () => {
        if (!handle.trim()) return;

        createMethod({
            type: "venmo",
            handle: handle.replace("@", ""), // strip @ if user included it
            isDefault: paymentMethods.length === 0, // default if first one
        }, {
            onSuccess: () => {
                setHandle("");
                setIsAdding(false);
            }
        });
    };

    const handleRemove = (id: string) => {
        // Simple confirmation before delete
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
                        ) : !isAdding && (
                            <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
                                <div className="bg-muted/50 p-3 rounded-full">
                                    <Wallet className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">No payment methods</p>
                                    <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                                        Link an account so friends can pay you back automatically.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* IN-LINE ADD FORM */}
                        {isAdding && (
                            <div className="space-y-3 p-3 border rounded-lg bg-accent/5 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold">Link Venmo</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => setIsAdding(false)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                                        <Input
                                            placeholder="username"
                                            value={handle}
                                            onChange={(e) => setHandle(e.target.value)}
                                            className="pl-7 h-9 text-sm"
                                            autoFocus
                                        />
                                    </div>
                                    <Button
                                        size="sm"
                                        className="h-9 bg-[#3d95ce] hover:bg-[#3d95ce]/90"
                                        onClick={handleAddVenmo}
                                        disabled={isCreating || !handle}
                                    >
                                        {isCreating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* FOOTER SECTION */}
                    <div className="bg-muted/20 flex flex-col gap-4 p-4 border-t">
                        {!isAdding && (
                            <Button
                                size="sm"
                                variant={paymentMethods.length > 0 ? "outline" : "default"}
                                className={`w-full text-xs shadow-sm ${paymentMethods.length === 0 ? "bg-[#3d95ce] hover:bg-[#3d95ce]/90 text-white" : ""}`}
                                onClick={() => setIsAdding(true)}
                            >
                                <Plus className="mr-2 h-3.5 w-3.5" />
                                {paymentMethods.length > 0 ? "Add Another Method" : "Link Venmo Account"}
                            </Button>
                        )}

                        {paymentMethods.length > 0 && !isAdding && (
                            <div className="flex items-center gap-3 px-1">
                                <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0">
                                    <CreditCard className="h-4 w-4" />
                                </div>
                                <div className="text-[11px] text-muted-foreground leading-snug flex-1">
                                    Your default method is used automatically when friends tap "Pay" in a shared room.
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function PaymentMethodItem({
    method,
    onRemove
}: {
    method: PaymentMethodDto;
    onRemove: () => void
}) {
    return (
        <div className="group flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className={`
                    flex h-9 w-9 shrink-0 items-center justify-center rounded-md border
                    ${method.type === 'venmo' ? 'bg-[#3d95ce]/10 text-[#3d95ce] border-[#3d95ce]/20' : 'bg-muted'}
                `}>
                    {method.type === 'venmo' ? (
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
                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">
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
