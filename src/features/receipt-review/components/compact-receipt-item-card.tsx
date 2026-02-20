import type { ReceiptItemDto } from '@/shared/dto/types';

interface CompactReceiptItemCardProps {
  item: ReceiptItemDto;
  onEdit?: () => void;
}

export function CompactReceiptItemCard({
  item,
  onEdit,
}: CompactReceiptItemCardProps) {
  const Component = onEdit ? 'button' : 'div';
  return (
    <Component
      type={onEdit ? 'button' : undefined}
      onClick={onEdit}
      className={
        onEdit
          ? 'w-full text-left rounded-lg border bg-card px-3 py-3 transition-colors hover:bg-accent/40 active:bg-accent/50'
          : 'rounded-lg border bg-card px-3 py-3'
      }
    >
      <div className="flex items-center  justify-between gap-3">
        <div className=" min-w-0 flex-1">
          <div className="text-sm font-semibold leading-snug">
            {item.quantity > 1 && (
              <span className="mr-1 text-[10px] text-muted-foreground">
                {item.quantity}x
              </span>
            )}
            {item.interpretedText}
          </div>
          {item.rawText && (
            <div className="mt-1 text-[10px] font-mono text-muted-foreground truncate">
              OCR: {item.rawText}
            </div>
          )}
        </div>
        <div className="shrink-0 text-sm  font-semibold tabular-nums">
          ${item.price.toFixed(2)}
        </div>
      </div>
    </Component>
  );
}
