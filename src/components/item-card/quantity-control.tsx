import { Button } from "@/components/ui/button";
import { Minus, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantityControlProps {
    totalQuantity: number;
    myQuantity: number;
    othersQuantity: number; // Sum of everyone else
    onIncrement: () => void;
    onDecrement: () => void;
}

export function QuantityControl({
    totalQuantity,
    myQuantity,
    othersQuantity,
    onIncrement,
    onDecrement,
}: QuantityControlProps) {
    const remaining = totalQuantity - myQuantity - othersQuantity;
    const canIncrement = remaining > 0;
    const canDecrement = myQuantity > 0;

    // Is the item completely accounted for?
    const isFullyClaimed = remaining === 0;

    return (
        <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between bg-secondary/30 rounded-lg p-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-md hover:bg-background hover:shadow-sm"
                    onClick={(e) => { e.stopPropagation(); onDecrement(); }}
                    disabled={!canDecrement}
                >
                    <Minus className="h-3 w-3" />
                </Button>

                <div className="flex flex-col items-center px-2">
                    <span className={cn(
                        "text-sm font-bold tabular-nums leading-none",
                        isFullyClaimed ? "text-green-600" : "text-foreground"
                    )}>
                        {myQuantity}
                    </span>
                    {/* Context: "of 5" is static. It anchors the user. */}
                    <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                        of {totalQuantity}
                    </span>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-8 w-8 rounded-md transition-all",
                        canIncrement
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                            : "opacity-20 cursor-not-allowed bg-transparent text-muted-foreground"
                    )}
                    onClick={(e) => { e.stopPropagation(); onIncrement(); }}
                    disabled={!canIncrement}
                >
                    <Plus className="h-3 w-3" />
                </Button>
            </div>

            {/* The "Story" Text - Crucial for context */}
            <div className="flex items-center justify-between px-1">
                {othersQuantity > 0 && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                        {othersQuantity} taken by others
                    </span>
                )}

                {remaining > 0 ? (
                    <span className="text-[10px] font-medium text-primary ml-auto">
                        {remaining} left
                    </span>
                ) : (
                    <span className="text-[10px] font-medium text-green-600 flex items-center gap-1 ml-auto">
                        <CheckCircle2 className="h-3 w-3" />
                        Done
                    </span>
                )}
            </div>
        </div>
    );
}
