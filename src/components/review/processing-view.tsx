import { Loader2 } from "lucide-react";

interface ProcessingReceiptViewProps {
    isPolling: boolean;
}

export function ProcessingReceiptView({ isPolling }: ProcessingReceiptViewProps) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border border-border bg-card p-8 shadow-sm">
                <Loader2
                    className={`h-10 w-10 animate-spin text-primary transition-opacity duration-500 ${isPolling ? 'opacity-90' : 'opacity-70'
                        }`}
                />

                <div className="text-center space-y-1.5">
                    <p className="text-base font-medium text-card-foreground">
                        Processing your receipt...
                    </p>
                    <p className="text-sm text-muted-foreground">
                        This may take a few moments
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                        It is safe to leave this page and come back
                    </p>
                </div>
            </div>
        </div>
    );
}
