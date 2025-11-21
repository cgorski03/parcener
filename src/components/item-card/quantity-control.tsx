import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantityControlProps {
    totalQuantity: number;
    myQuantity: number; // How many I have claimed
    remainingQuantity: number; // How many are left unclaimed in the room
    onIncrement: () => void;
    onDecrement: () => void;
    onOpenSplitSheet: () => void; // Opens your modal
}

export function QuantityControl({
    totalQuantity,
    myQuantity,
    remainingQuantity,
    onIncrement,
    onDecrement,
    onOpenSplitSheet
}: QuantityControlProps) {
    const canIncrement = remainingQuantity > 0;
    const canDecrement = myQuantity > 0;

    return (
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-1 mt-2 animate-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-background shadow-sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDecrement();
                    }}
                    disabled={!canDecrement}
                >
                    <Minus className="h-3 w-3" />
                </Button>

                <div className="flex flex-col items-center w-12">
                    <span className="text-sm font-bold tabular-nums leading-none">
                        {myQuantity}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                        of {totalQuantity}
                    </span>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-8 w-8 rounded-md shadow-sm transition-all",
                        canIncrement
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "text-muted-foreground opacity-50"
                    )}
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        onIncrement();
                    }}
                    disabled={!canIncrement}
                >
                    <Plus className="h-3 w-3" />
                </Button>
            </div>

            {/* Advanced Split Button (Triggers your Sheet) */}
            <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-primary ml-2"
                onClick={(e) => {
                    e.stopPropagation();
                    onOpenSplitSheet();
                }}
            >
                Custom Split
            </Button>
        </div>
    );
}
