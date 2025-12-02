import { Share2 } from "lucide-react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

interface QrShareSheetProps {
    /** The title displayed at the top of the sheet */
    title?: string;
    /** The description text. Supports simple markup or pass a node. */
    description?: React.ReactNode;
    /** The actual data/URL to encode in the QR */
    value: string;
    /** Optional: The text used in the share button */
    shareText?: string;
    /** Optional: Pass your own trigger button. If not provided, one isn't rendered (useful for controlled state) */
    trigger?: React.ReactNode;
    /** Controlled open state */
    open?: boolean;
    /** Controlled onOpenChange */
    onOpenChange?: (open: boolean) => void;
}

export function QrShareSheet({
    title = "Invite Friends",
    description,
    value,
    shareText = "Share Link",
    trigger,
    open,
    onOpenChange,
}: QrShareSheetProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;

    const isOpen = isControlled ? open : internalOpen;
    const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: typeof description === 'string' ? description : undefined,
                    url: value,
                });
            } catch (error) {
                // Ignore AbortError (user cancelled)
                if ((error as Error).name !== "AbortError") {
                    console.error("Error sharing:", error);
                }
            }
        } else {
            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(value);
            } catch (err) {
                console.error("Failed to copy link");
            }
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
            <SheetContent side="bottom" className="rounded-t-xl">
                <SheetHeader className="mb-6">
                    <SheetTitle>{title}</SheetTitle>
                </SheetHeader>

                <div className="flex flex-col items-center justify-center space-y-6 pb-8">
                    <div className="bg-white p-4 rounded-xl shadow-sm border">
                        <QRCode value={value} size={128} />
                    </div>

                    {description && (
                        <div className="text-sm text-muted-foreground text-center max-w-xs">
                            {description}
                        </div>
                    )}

                    <Button
                        className="w-full max-w-sm"
                        size="lg"
                        onClick={handleNativeShare}
                    >
                        <Share2 className="h-4 w-4 mr-2" />
                        {shareText}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
