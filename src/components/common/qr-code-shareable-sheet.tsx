import QRCode from "react-qr-code";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { ShareButton } from "./share-button";

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
    title = "Invite Friends",
    description,
    value,
    shareText,
    trigger,
    open,
    onOpenChange,
}: QrShareSheetProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;

    const isOpen = isControlled ? open : internalOpen;
    const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

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

                    <ShareButton
                        value={value}
                        title={title}
                        shareText={shareText}
                        className="w-full"
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
