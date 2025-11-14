import { Receipt } from 'lucide-react';

interface ReviewReceiptHeaderBasicProps {
    title: string;
    itemCount: number;
    subtotal: string; // already formatted like "12.34"
}

export function ReviewReceiptHeader({
    title,
    itemCount,
    subtotal,
}: ReviewReceiptHeaderBasicProps) {
    return (
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b">
            <div className="container max-w-2xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Receipt className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold truncate">{title}</h2>
                            <p className="text-xs text-muted-foreground">{itemCount} items</p>
                        </div>
                    </div>

                    <div className="text-right shrink-0">
                        <span className="text-2xl font-bold">${subtotal}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
