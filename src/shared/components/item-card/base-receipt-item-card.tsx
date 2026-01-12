import { DollarSign } from 'lucide-react';
import type { ReceiptItemDto } from '@/shared/dto/types';
import { Card } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';

export interface BaseItemCardProps {
  item: ReceiptItemDto;
  onClick?: () => void;
  variant?: 'default' | 'active' | 'dimmed';
  rightElement?: React.ReactNode;
  footerElement?: React.ReactNode;
  className?: string;
}

export function BaseReceiptItemCard({
  item,
  onClick,
  variant = 'default',
  rightElement,
  footerElement,
  className,
}: BaseItemCardProps) {
  const variantStyles = {
    default: 'bg-card border-border hover:border-muted-foreground/30',
    active: 'bg-orange-50/60 border-orange-400 shadow-sm',
    dimmed: 'opacity-60 bg-muted/30 border-transparent grayscale-[0.5]',
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        'relative p-3 transition-all duration-200 border-l-4 overflow-hidden',
        onClick && 'cursor-pointer ',
        variantStyles[variant],
        className,
      )}
    >
      {/* Visual Glow for Active State */}
      {variant === 'active' && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      )}

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Text Data */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold leading-snug text-foreground">
              {item.quantity > 1 && (
                <span className="text-muted-foreground font-normal mr-1">
                  {item.quantity}x
                </span>
              )}
              {item.interpretedText}
            </div>

            {/* Price Row */}
            <div className="flex items-center gap-1 mt-1.5">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span
                className={cn(
                  'font-bold text-lg',
                  variant === 'dimmed' && 'text-muted-foreground',
                )}
              >
                {item.price.toFixed(2)}
              </span>
              {item.quantity > 1 && (
                <span className="text-xs text-muted-foreground ml-2">
                  (${(item.price / item.quantity).toFixed(2)} / unit)
                </span>
              )}
            </div>
          </div>

          {/* Right: Slot (Avatars, Edit Icon, etc) */}
          {rightElement && <div className="shrink-0 ml-2">{rightElement}</div>}
        </div>

        {/* Bottom: Slot (Controls, Raw Text, etc) */}
        {footerElement && <div className="mt-2 pt-1">{footerElement}</div>}
      </div>
    </Card>
  );
}
