interface ReceiptLayoutShellProps {
    header: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export function ReceiptLayoutShell({ header, children, footer }: ReceiptLayoutShellProps) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
            {/* Sticky Header */}
            <div className="sticky top-0 z-40 w-full">
                {header}
            </div>

            {/* Main Scrollable Content */}
            <main className="flex-1 container max-w-2xl mx-auto px-4 py-6 pb-32 md:pb-12">
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </main>

            {/* Sticky Mobile Footer (Optional - typically for Action Buttons) */}
            {footer && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur border-t md:hidden z-50 pb-8">
                    <div className="max-w-2xl mx-auto">
                        {footer}
                    </div>
                </div>
            )}
        </div>
    );
}
