import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

interface PriceBreakdownProps {
    subtotal: number
    tax: number
    tip: number
    grandTotal: number
    label?: string
    className?: string
    onClick?: () => void
    errorMessage?: string
    actionButton?: React.ReactNode
    groupClassName?: string
}

export function PriceBreakdown({
    subtotal,
    tax,
    tip,
    grandTotal,
    label = 'Summary',
    className,
    onClick,
    errorMessage,
    actionButton,
    groupClassName,
}: PriceBreakdownProps) {
    const card = (
        <div
            onClick={onClick}
            className={cn(
                'space-y-1 p-4 rounded-lg border bg-card text-card-foreground shadow-sm',
                onClick && 'cursor-pointer hover:bg-accent/50 transition-colors',
                className,
            )}
        >
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {label}
            </h4>

            <Row label="Subtotal" amount={subtotal} />
            <Row label="Tax" amount={tax} muted />
            <Row label="Tip" amount={tip} muted />

            <div className="pt-2 mt-2 border-t flex justify-between items-end">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">${grandTotal.toFixed(2)}</span>
            </div>
        </div>
    )

    // Return just the card if no error or action button
    if (!errorMessage && !actionButton) {
        return card
    }

    // Wrap in container to manage spacing when extras are present
    return (
        <div className={cn('space-y-3', groupClassName)}>
            {card}
            {errorMessage && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}
            {actionButton}
        </div>
    )
}

function Row({
    label,
    amount,
    muted,
}: {
    label: string
    amount: number
    muted?: boolean
}) {
    return (
        <div
            className={cn(
                'flex justify-between text-sm',
                muted && 'text-muted-foreground',
            )}
        >
            <span>{label}</span>
            <span>${amount.toFixed(2)}</span>
        </div>
    )
}
