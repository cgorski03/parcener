import { ReceiptItemDto } from "@/server/get-receipt/types";
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export function EditItemSheet(props: {
    item: ReceiptItemDto | null,
    setCurrentlyEditingItem: (item: ReceiptItemDto | null) => void
}) {
    const { item, setCurrentlyEditingItem } = props;
    const [priceMode, setPriceMode] = useState<'unit' | 'total'>('total');
    const [quantity, setQuantity] = useState(item?.quantity ?? 1);
    const [totalPrice, setTotalPrice] = useState(item?.price ?? 0);

    const unitPrice = quantity > 0 ? totalPrice / quantity : 0;

    console.log(item)
    console.log(quantity, priceMode, totalPrice, unitPrice);
    const handlePriceChange = (value: number) => {
        value *= 10;
        if (priceMode === 'unit') {
            setTotalPrice(value * quantity);
        } else {
            console.log(value)
            setTotalPrice(value);
        }
    };

    const handleQuantityChange = (value: number) => {
        setQuantity(value);
        if (priceMode === 'unit') {
            // Keep unit price constant, recalculate total
            setTotalPrice(unitPrice * value);
        }
    };

    return (
        <Sheet
            open={!!item}
            onOpenChange={(open) => !open && setCurrentlyEditingItem(null)}
        >
            <SheetContent
                side="bottom"
                className="rounded-t-2xl px-6 py-6 duration-200"
            >
                {item && (
                    <>
                        <SheetHeader >
                            <SheetTitle className="text-2xl">Edit Item</SheetTitle>
                            <SheetDescription >Change any item details</SheetDescription>
                        </SheetHeader>

                        <div className="space-y-6">
                            {/* Item Name */}
                            <div className="space-y-3">
                                <Label htmlFor="itemName" className="text-base font-medium">
                                    Item Name
                                </Label>
                                <Input
                                    id="itemName"
                                    type="text"
                                    defaultValue={item.interpretedText}
                                    className="text-lg h-14 px-4"
                                    placeholder="e.g., Cheeseburger"
                                />
                            </div>

                            {/* Price Mode Toggle */}
                            <div className="space-y-3">
                                <Label className="text-base font-medium">
                                    Price Input Mode
                                </Label>
                                <div className="inline-flex rounded-lg bg-muted p-1 w-full">
                                    <button
                                        type="button"
                                        onClick={() => setPriceMode('total')}
                                        className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${priceMode === 'total'
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        Total Price
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPriceMode('unit')}
                                        className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${priceMode === 'unit'
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
                                <div className="space-y-3">
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
                                            value={priceMode === 'unit' ? unitPrice.toFixed(2) : totalPrice.toFixed(2)}
                                            onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                                            className="text-lg h-14 pl-8 pr-4"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="quantity" className="text-base font-medium">
                                        Quantity
                                    </Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        step="0.01"
                                        min="0.00"
                                        value={quantity}
                                        onChange={(e) => handleQuantityChange(parseFloat(e.target.value))}
                                        className="text-lg h-14 px-4"
                                        placeholder="1"
                                    />
                                </div>
                            </div>

                            {/* Calculated Summary */}
                            <div className="p-5 bg-muted/50 rounded-xl border border-border space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        {priceMode === 'unit' ? 'Total Price' : 'Unit Price'}
                                    </span>
                                    <span className="text-lg font-semibold text-foreground">
                                        ${priceMode === 'unit' ? totalPrice.toFixed(2) : unitPrice.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-border">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Item Total
                                    </span>
                                    <span className="text-2xl font-bold text-foreground">
                                        ${totalPrice.toFixed(2)}
                                    </span>
                                </div>
                                {quantity > 1 && (
                                    <p className="text-xs text-muted-foreground pt-1">
                                        ${unitPrice.toFixed(2)} × {quantity}
                                    </p>
                                )}
                            </div>

                            {/* Raw OCR Text */}
                            <details className="group">
                                <summary className="text-sm font-medium text-muted-foreground cursor-pointer list-none flex items-center justify-between">
                                    <span>Original OCR Text</span>
                                    <span className="text-xs group-open:rotate-270 transition-transform">{"<"}</span>
                                </summary>
                                <div className="mt-2 p-3 bg-muted/30 rounded-md border border-dashed border-border">
                                    <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                                        {item.rawText}
                                    </p>
                                </div>
                            </details>

                            {/* Action Buttons */}
                            <div className="space-y-3 pt-6">
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="flex-1 h-14 text-base"
                                        onClick={() => setCurrentlyEditingItem(null)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="lg"
                                        className="flex-1 h-14 text-base"
                                        onClick={() => {
                                            // TODO: Save with totalPrice and quantity
                                            setCurrentlyEditingItem(null)
                                        }}
                                    >
                                        Save Changes
                                    </Button>
                                </div>

                                <Button
                                    variant="destructive"
                                    size="lg"
                                    className="w-full h-14 text-base"
                                    onClick={() => {
                                        // TODO: Delete item
                                        setCurrentlyEditingItem(null)
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Item
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}
