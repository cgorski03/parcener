import { Receipt, Loader2, XCircle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { AppHeader } from '@/shared/components/layout/app-header'

interface ReviewReceiptHeaderProps {
    title: string
    itemCount: number
    grandTotal: number
    receiptIsValidPending: boolean
    receiptIsInvalid: boolean
}

export function ReviewReceiptHeader({
    title,
    itemCount,
    grandTotal,
    receiptIsValidPending,
    receiptIsInvalid,
}: ReviewReceiptHeaderProps) {
    const status = receiptIsValidPending
        ? 'pending'
        : receiptIsInvalid
            ? 'invalid'
            : 'valid'

    const statusConfig = {
        pending: {
            icon: Loader2,
            iconClass: 'h-4 w-4 text-primary animate-spin',
            containerClass: 'bg-primary/10 border-primary/20',
        },
        invalid: {
            icon: XCircle,
            iconClass: 'h-4 w-4 text-destructive',
            containerClass: 'bg-destructive/10 border-destructive/20',
        },
        valid: {
            icon: Receipt,
            iconClass: 'h-4 w-4 text-primary',
            containerClass: 'bg-primary/10 border-primary/20',
        },
    }

    const { icon: StatusIcon, iconClass, containerClass } = statusConfig[status]
    return (
        <AppHeader
            className={cn(receiptIsInvalid && 'border-b-destructive/30')}
            title={
                <div className="flex items-center gap-3.5"> {/* Increased gap */}
                    {/* Status Icon Box */}
                    <div
                        className={cn(
                            'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-colors',
                            containerClass
                        )}
                    >
                        <StatusIcon className={iconClass} />
                    </div>

                    {/* Text Info */}
                    <div className="flex flex-col justify-center min-w-0 gap-0.5"> {/* Added gap-0.5 */}
                        <span className="font-bold text-base leading-none truncate tracking-tight">
                            {title}
                        </span>
                        <span className="text-xs text-muted-foreground truncate flex items-center">
                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            {receiptIsInvalid && (
                                <span className="flex items-center text-destructive font-medium ml-2">
                                    <span className="w-1 h-1 rounded-full bg-destructive mr-1.5" />
                                    Action Required
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            }

            right={
                <div className="flex flex-col items-end justify-center">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
                        Total
                    </span>
                    <span
                        className={cn(
                            'text-xl font-bold leading-none tabular-nums tracking-tight',
                            receiptIsInvalid ? 'text-destructive' : 'text-foreground',
                        )}
                    >
                        ${grandTotal.toFixed(2)}
                    </span>
                </div>
            }
        />
    )
}
