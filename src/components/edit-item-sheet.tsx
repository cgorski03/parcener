import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from './ui/button'
import { Trash2 } from 'lucide-react'
import React, { useState } from 'react'
import { ReceiptItemDto } from '@/server/dtos'

function ReceiptItemSheet(props: {
  showSheet: boolean
  item: ReceiptItemDto | null
  handleSaveItem: (item: ReceiptItemDto, isCreate: boolean) => void
  handleDeleteItem: (item: ReceiptItemDto) => void
  closeSheet: () => void
}) {
  const { showSheet, item, handleSaveItem, handleDeleteItem, closeSheet } =
    props

  const isCreate = showSheet && item === null
  const initialQuantity = item?.quantity ?? 1
  const initialPrice = item?.price ?? 0
  const initialUnitPrice =
    initialQuantity > 0 ? initialPrice / initialQuantity : 0

  const [priceMode, setPriceMode] = useState<'unit' | 'total'>('total')
  const [quantity, setQuantity] = useState(initialQuantity)
  const [totalPrice, setTotalPrice] = useState(initialPrice)
  const unitPrice = quantity > 0 ? totalPrice / quantity : 0
  const [priceInput, setPriceInput] = useState(
    (priceMode === 'unit' ? initialUnitPrice : initialPrice).toFixed(2),
  )
  const [itemText, setItemText] = useState(item?.interpretedText ?? '')

  const saveItem = () => {
    const newItem: ReceiptItemDto = {
      id: item?.id ?? crypto.randomUUID(),
      quantity: quantity,
      rawText: item?.rawText ?? '',
      interpretedText: itemText,
      price: totalPrice,
    }
    handleSaveItem(newItem, isCreate)
  }

  const handlePriceModeChange = (mode: 'unit' | 'total') => {
    setPriceMode(mode)
    if (mode === 'unit') {
      const newPriceInput = totalPrice / quantity
      setPriceInput(newPriceInput.toFixed(2))
    } else {
      setPriceInput((unitPrice * quantity).toFixed(2))
    }
  }

  const handlePriceInputChange = (value: number) => {
    if (priceMode === 'unit') {
      setTotalPrice(value * quantity)
    } else {
      setTotalPrice(value)
    }
  }

  const handleQuantityInputChange = (value: number) => {
    setQuantity(value)
    if (priceMode === 'unit') {
      setTotalPrice(Number(priceInput) * value)
    }
  }

  return (
    <Sheet
      open={isCreate || (!!item && showSheet)}
      onOpenChange={(open) => !open && closeSheet()}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-4 py-4 !duration-250"
        onOpenAutoFocus={(e) => {
          e.preventDefault() // Prevent auto-focus behavior
        }}
      >
        <>
          <SheetHeader className="pl-0">
            <SheetTitle className="text-xl">
              {isCreate ? 'Add New Item' : 'Edit Item'}
            </SheetTitle>
            <SheetDescription className="text-sm">
              {isCreate ? 'Enter item details' : 'Change details'}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4">
            {/* Item Name */}
            <div className="space-y-2">
              <Label htmlFor="itemName" className="text-base font-medium">
                Item Name
              </Label>
              <Input
                id="itemName"
                type="text"
                value={itemText}
                onChange={(e) => setItemText(e.target.value)}
                className="text-lg h-11 px-4"
                placeholder="e.g., Cheeseburger"
              />
            </div>

            {/* Price Mode Toggle */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Price Input Mode</Label>
              <div className="inline-flex rounded-lg bg-muted p-1 w-full">
                <button
                  type="button"
                  onClick={() => handlePriceModeChange('total')}
                  className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                    priceMode === 'total'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Total Price
                </button>
                <button
                  type="button"
                  onClick={() => handlePriceModeChange('unit')}
                  className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                    priceMode === 'unit'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Unit Price
                </button>
              </div>
            </div>

            {/* Price and Quantity Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-base font-medium">
                  {priceMode === 'unit' ? 'Unit Price' : 'Total Price'}
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg font-medium">
                    $
                  </span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceInput}
                    onChange={(e) => {
                      setPriceInput(e.target.value)
                      handlePriceInputChange(parseFloat(e.target.value) || 0)
                    }}
                    className="text-lg h-11 pl-8 pr-4"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-base font-medium">
                  Quantity
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0.00"
                  value={quantity}
                  onChange={(e) =>
                    handleQuantityInputChange(parseFloat(e.target.value))
                  }
                  className="text-lg h-11 px-4"
                  placeholder="1"
                />
              </div>
            </div>

            {/* Calculated Summary */}
            <div className="p-3 bg-muted/50 rounded-xl border border-border space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {priceMode === 'unit' ? 'Total Price' : 'Unit Price'}
                </span>
                <span className="text-lg font-semibold text-foreground">
                  $
                  {priceMode === 'unit'
                    ? totalPrice.toFixed(2)
                    : unitPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="flex items-center text-sm font-medium text-muted-foreground">
                  Total
                  {quantity > 1 && ` (${unitPrice.toFixed(2)} × ${quantity})`}
                </span>
                <span className="text-2xl font-bold text-foreground">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Raw OCR Text - Only in Edit Mode */}
            {!isCreate && item?.rawText && (
              <details className="group">
                <summary className="text-sm font-medium text-muted-foreground cursor-pointer list-none flex items-center justify-between">
                  <span>Original OCR Text</span>
                  <span className="text-xs group-open:rotate-270 transition-transform">
                    {'<'}
                  </span>
                </summary>
                <div className="mt-2 p-3 bg-muted/30 rounded-md border border-dashed border-border">
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                    {item.rawText}
                  </p>
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-6">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 h-11 text-base"
                  onClick={() => closeSheet()}
                >
                  Cancel
                </Button>
                <Button
                  size="lg"
                  className="flex-1 h-11 text-base"
                  onClick={saveItem}
                >
                  {isCreate ? 'Add Item' : 'Save Changes'}
                </Button>
              </div>

              {!isCreate && item && (
                <Button
                  variant="destructive"
                  size="lg"
                  className="w-full h-11 text-base"
                  onClick={() => {
                    handleDeleteItem(item)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Item
                </Button>
              )}
            </div>
          </div>
        </>
      </SheetContent>
    </Sheet>
  )
}

export default React.memo(ReceiptItemSheet)
