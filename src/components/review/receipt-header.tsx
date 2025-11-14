import { Receipt, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewReceiptHeaderBasicProps {
    title: string;
    itemCount: number;
    grandTotal: number;
    receiptIsValidPending: boolean;
    receiptIsInvalid: boolean;
}

export function ReviewReceiptHeader({
    title,
    itemCount,
    grandTotal,
    receiptIsValidPending,
    receiptIsInvalid,
}: ReviewReceiptHeaderBasicProps) {
    // Determine status (mutually exclusive for clean UI)
    const status = receiptIsValidPending ? 'pending' : receiptIsInvalid ? 'invalid' : 'valid';

    const statusConfig = {
        pending: {
            icon: Loader2,
            iconClass: "h-4 w-4 text-primary animate-spin",
            containerClass: "bg-primary/10",
        },
        invalid: {
            icon: XCircle,
            iconClass: "h-4 w-4 text-destructive",
            containerClass: "bg-destructive/10",
        },
        valid: {
            icon: Receipt,
            iconClass: "h-4 w-4 text-primary",
            containerClass: "bg-primary/10",
        },
    };

    const { icon: StatusIcon, iconClass, containerClass } = statusConfig[status];

    return (
        <header className={cn(
            "sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b",
            receiptIsInvalid && "border-destructive/50"
        )}>
            <div className="container max-w-2xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", containerClass)}>
                            <StatusIcon className={iconClass} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold truncate">{title}</h2>
                            <p className="text-xs text-muted-foreground">
                                {itemCount} items
                                {receiptIsInvalid && <span className="text-destructive ml-1">• Invalid</span>}
                            </p>
                        </div>
                    </div>

                    <div className="text-right shrink-0">
                        <span className={cn(
                            "text-2xl font-bold",
                            receiptIsInvalid && "text-destructive"
                        )}>
                            ${grandTotal.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
