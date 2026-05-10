import { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';

export interface BreakdownItem {
  id: string;
  quantity: number;
  name: string;
  price: number;
}

interface PriceBreakdownProps {
  subtotal: number;
  tax: number;
  tip: number;
  grandTotal: number;
  /** Optional list of specific items to display before the math */
  items?: Array<BreakdownItem>;
  label?: string;
  className?: string;
  onClick?: () => void;
  errorMessage?: string;
  actionButton?: React.ReactNode;
  groupClassName?: string;
  metadataText?: string;
}

export function PriceBreakdown({
  subtotal,
  tax,
  tip,
  grandTotal,
  items,
  label = 'Summary',
  className,
  onClick,
  errorMessage,
  actionButton,
  groupClassName,
  metadataText,
}: PriceBreakdownProps) {
  const [showItems, setShowItems] = useState(false);

  const card = (
    <div
      onClick={onClick}
      className={cn(
        'px-4 py-3 rounded-2xl border border-dashed bg-background text-card-foreground',
        onClick && 'cursor-pointer hover:bg-muted/20 transition-colors',
        className,
      )}
    >
      <div className="pt-2 mt-1 mb-3">
        <div className="w-full overflow-hidden font-mono text-xs text-muted-foreground/70 leading-none mb-2 whitespace-nowrap">
          {('='.repeat(80))}
        </div>
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">
            {label}
          </h4>
        {items && items.length > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
            onClick={(e) => {
              e.stopPropagation();
              setShowItems(!showItems);
            }}
          >
            {showItems ? 'Hide Items' : 'View Items'}
            {showItems ? (
              <ChevronUp className="ml-1 h-3 w-3" />
            ) : (
              <ChevronDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        ) : (
          /* Prevent Layout Shift */
          <div className="h-6" />
        )}
        </div>
      </div>

      {/* Itemized List Section */}
      {items && showItems && (
        <div className="space-y-2 mb-4 py-1 animate-in slide-in-from-top-2 fade-in duration-200">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {item.quantity > 1 && (
                  <span className="text-foreground font-medium mr-1">
                    {item.quantity}x
                  </span>
                )}
                {item.name}
              </span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <Separator className="my-2 border-dashed border-muted-foreground/40" />
        </div>
      )}

      <div className="space-y-1 py-1">
        <Row label="Subtotal" amount={subtotal} />
        <Row label="Tax" amount={tax} muted />
        <Row label="Tip" amount={tip} muted />
      </div>

      <div className="pt-3 mt-3">
        <div className="w-full overflow-hidden font-mono text-xs text-muted-foreground/70 leading-none mb-2 whitespace-nowrap">
          {('='.repeat(80))}
        </div>
        <div className="flex justify-between items-end">
        <span className="font-semibold text-foreground">Total</span>
        <span className="text-xl font-bold tracking-tight tabular-nums text-foreground">
          ${grandTotal.toFixed(2)}
        </span>
        </div>
        {metadataText && (
          <div className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/45">
            {metadataText}
          </div>
        )}
      </div>
    </div>
  );

  if (!errorMessage && !actionButton) {
    return card;
  }

  return (
    <div className={cn('space-y-3', groupClassName)}>
      {card}

      {/* Error Message */}
      {errorMessage && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {actionButton}
    </div>
  );
}

function Row({
  label,
  amount,
  muted,
}: {
  label: string;
  amount: number;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex justify-between text-sm font-normal',
        muted ? 'text-muted-foreground' : 'text-foreground/70',
      )}
    >
      <span>{label}</span>
      <span>${amount.toFixed(2)}</span>
    </div>
  );
}
