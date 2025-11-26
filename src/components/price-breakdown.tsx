import { cn } from '@/lib/utils'

interface PriceBreakdownProps {
  subtotal: number
  tax: number
  tip: number
  grandTotal: number
  label?: string
  className?: string
  onClick?: () => void
}

export function PriceBreakdown({
  subtotal,
  tax,
  tip,
  grandTotal,
  label = 'Summary',
  className,
  onClick,
}: PriceBreakdownProps) {
  return (
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
