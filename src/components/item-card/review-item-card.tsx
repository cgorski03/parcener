import { ChevronRight } from 'lucide-react'
import { ReceiptItemDto } from '@/server/dtos'
import { BaseReceiptItemCard } from './base-receipt-item-card'

interface ReviewItemCardProps {
  item: ReceiptItemDto
  onEdit: () => void
}

export function ReviewItemCard({ item, onEdit }: ReviewItemCardProps) {
  return (
    <BaseReceiptItemCard
      item={item}
      onClick={onEdit}
      variant="default"
      rightElement={
        <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
      }
      footerElement={
        item.rawText ? (
          <p className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded truncate">
            OCR: {item.rawText}
          </p>
        ) : null
      }
    />
  )
}
