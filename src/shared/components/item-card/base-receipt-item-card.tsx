import type { ReceiptItemDto } from '@/shared/dto/types';
import { cn } from '@/shared/lib/utils';

export interface BaseItemCardProps {
  item: ReceiptItemDto;
  onClick?: () => void;
  variant?: 'default' | 'active' | 'dimmed';
  prefixElement?: React.ReactNode;
  footerElement?: React.ReactNode;
  className?: string;
}

export function BaseReceiptItemCard({
  item,
  onClick,
  variant = 'default',
  prefixElement,
  footerElement,
  className,
}: BaseItemCardProps) {
  const variantStyles = {
    default: 'bg-transparent',
    active: 'bg-orange-50/70',
    dimmed: 'bg-transparent',
  };

  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        'relative block w-full text-left overflow-hidden after:pointer-events-none after:absolute after:inset-x-4 after:bottom-0 after:border-b-2 after:border-dashed after:border-foreground/35 first:rounded-t-none last:rounded-b-none last:after:hidden',
        'px-4 py-5 transition-colors duration-300',
        onClick && 'cursor-pointer ',
        variantStyles[variant],
        className,
      )}
    >
      {variant === 'active' && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-orange-400/10 blur-2xl" />
      )}
      <div
        className={cn(
          'relative',
          variant === 'dimmed' && 'opacity-55 grayscale-[0.35]',
        )}
      >
        <div className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex items-center justify-start">
            {prefixElement}
          </div>
          <div className="min-w-0">
            <div className="text-[15px] leading-snug text-foreground font-mono truncate">
              <span className="font-semibold">{item.interpretedText}</span>
            </div>
          </div>
          <span className="shrink-0 text-[15px] font-normal tabular-nums text-muted-foreground">
            ${item.price.toFixed(2)}
          </span>
        </div>

        {/* Bottom: Slot (Controls, Raw Text, etc) */}
        {footerElement && (
          <div className="mt-2 pl-0.5">
            {footerElement}
          </div>
        )}
      </div>
    </button>
  );
}
