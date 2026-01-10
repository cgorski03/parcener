import QRCode from 'react-qr-code';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/shared/components/ui/sheet';
import { Button } from '@/shared/components/ui/button';
import { useState } from 'react';
import { ShareButton } from './share-button';
import { Check, Copy } from 'lucide-react';

interface QrShareSheetProps {
    title?: string;
    description?: React.ReactNode;
    value: string;
    shareText?: string;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function QrShareSheet({
    title = 'Invite Friends',
    description,
    value,
    shareText,
    trigger,
    open,
    onOpenChange,
}: QrShareSheetProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);

    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;
    const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
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

                    {/* New Button Layout: Share (Expand) + Copy (Icon) */}
                    <div className="mx-auto flex justify-center px-4 w-full gap-3">
                        <ShareButton
                            value={value}
                            title={title}
                            shareText={shareText}
                            className="flex-1"
                        />

                        <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            onClick={handleCopy}
                            aria-label="Copy invite link"
                        >
                            {hasCopied ? (
                                <Check className="h-4 w-4" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
