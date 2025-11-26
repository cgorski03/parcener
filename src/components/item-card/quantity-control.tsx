import { Button } from '@/components/ui/button'
import { Minus, Plus, Check, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuantityControlProps {
  totalQuantity: number
  myQuantity: number
  othersQuantity: number
  onIncrement: () => void
  onDecrement: () => void
}

export function QuantityControl({
  totalQuantity,
  myQuantity,
  othersQuantity,
  onIncrement,
  onDecrement,
}: QuantityControlProps) {
  const remaining = totalQuantity - myQuantity - othersQuantity
  const canIncrement = remaining > 0
  const canDecrement = myQuantity > 0
  const isFullyClaimed = remaining === 0

  const othersPercent = (othersQuantity / totalQuantity) * 100

  return (
    <div className=" pt-3 border-t border-dashed border-border/60">
      <div className="flex items-end justify-between gap-4">
        {/* Left Side: Capacity & Progress */}
        <div className="flex-1 pb-1.5 min-w-0">
          {/* Text Labels */}
          <div className="flex justify-between text-[10px] mb-2 font-medium">
            <span
              className={cn(
                'transition-colors flex items-center gap-1.5',
                othersQuantity > 0
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/40',
              )}
            >
              <Users className="h-3 w-3" />
              {othersQuantity > 0 ? `${othersQuantity} by others` : 'No others'}
            </span>

            {remaining > 0 ? (
              <span className="text-primary/80">{remaining} left</span>
            ) : (
              <span className="text-green-600 flex items-center gap-1">
                <Check className="h-3 w-3" /> Done
              </span>
            )}
          </div>

          {/* 
                       The Multi-Segment Progress Bar 
                       We overlay two segments inside the Progress container relative logic.
                    */}
          <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden relative">
            {/* Segment 1: Others (Base Layer - Muted Color) */}
            <div
              className="absolute top-0 left-0 h-full bg-muted-foreground/30 transition-all duration-300"
              style={{ width: `${othersPercent}%` }}
            />

            {/* Segment 2: Mine (Top Layer - Primary Color) */}
            {/* We position this 'left' based on where 'others' ended */}
            <div
              className="absolute top-0 h-full bg-primary transition-all duration-300 ease-out"
              style={{
                left: `${othersPercent}%`,
                width: `${(myQuantity / totalQuantity) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Right Side: Stepper Controls */}
        <div className="flex items-center gap-3 bg-background border rounded-full px-1.5 py-1 shadow-sm shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-muted text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation()
              onDecrement()
            }}
            disabled={!canDecrement}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>

          <div className="flex flex-col items-center min-w-[2.5rem]">
            <span
              className={cn(
                'text-sm font-bold tabular-nums leading-none transition-colors',
                isFullyClaimed ? 'text-green-600' : 'text-foreground',
              )}
            >
              {myQuantity}
            </span>
            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider leading-none mt-0.5">
              of {totalQuantity}
            </span>
          </div>

          <Button
            size="icon"
            className={cn(
              'h-7 w-7 rounded-full shadow-none transition-all',
              canIncrement
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted opacity-50',
            )}
            onClick={(e) => {
              e.stopPropagation()
              onIncrement()
            }}
            disabled={!canIncrement}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
