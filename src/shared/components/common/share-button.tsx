import { useState } from "react";
import { Share2, Check, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { logger } from "@/shared/observability/logger";
import { SENTRY_EVENTS } from "@/shared/observability/sentry-events";

interface ShareButtonProps extends React.ComponentProps<typeof Button> {
    value: string;
    title: string;
    shareText?: string;
}

export function ShareButton({
    value,
    title,
    shareText = "Share Link",
    className,
    variant,
    size = "lg",
    ...props
}: ShareButtonProps) {
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleShare = async () => {
        setStatus('idle');

        // 1. Try Native Share
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    url: value,
                });
                setStatus('success');
                setTimeout(() => setStatus('idle'), 2000);
            } catch (error) {
                if ((error as Error).name === "AbortError") return;

                logger.error(error, SENTRY_EVENTS.SOCIAL.SHARE_LINK, { url: value });
                setStatus('error');
            }
            return;
        }

        // 2. Fallback to Clipboard
        try {
            await navigator.clipboard.writeText(value);
            setStatus('success');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (err) {
            logger.error(err, SENTRY_EVENTS.SOCIAL.COPY_TO_CLIPBOARD);
            setStatus('error');
        }
    };

    return (
        <div className="w-full max-w-sm flex flex-col gap-2">
            <Button
                onClick={handleShare}
                size={size}
                className={className}
                // Override variant based on status
                variant={status === 'error' ? "destructive" : variant ?? "default"}
                {...props}
            >
                {status === 'success' ? (
                    <Check className="h-4 w-4 mr-2" />
                ) : status === 'error' ? (
                    <X className="h-4 w-4 mr-2" />
                ) : (
                    <Share2 className="h-4 w-4 mr-2" />
                )}

                {status === 'success' ? "Copied!" :
                    status === 'error' ? "Error Copying" :
                        shareText}
            </Button>

            {/* Fallback Input */}
            {status === 'error' && (
                <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                        Could not auto-copy. Please copy manually:
                    </p>
                    <input
                        readOnly
                        value={value}
                        className="w-full text-center text-sm p-2 bg-muted rounded border font-mono select-all"
                        onClick={(e) => e.currentTarget.select()}
                    />
                </div>
            )}
        </div>
    );
}
