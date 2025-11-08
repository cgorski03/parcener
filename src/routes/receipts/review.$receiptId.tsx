import { createFileRoute } from '@tanstack/react-router'
import { getReceipt } from '@/server/get-receipt/rpc-get-receipt'
import { isFailed, isProcessing } from '@/lib/receipt-utils'
import { ReceiptItemCard } from '@/components/receipt-item-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Share2, Loader2, Receipt } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/receipts/review/$receiptId')({
    loader: async ({ params }) => {
        return await getReceipt({ data: params.receiptId })
    },
    component: RouteComponent,
})

function RouteComponent() {
    const receipt = Route.useLoaderData()
    const [isCreatingRoom, setIsCreatingRoom] = useState(false)

    if (receipt === null) {
        return (<div>
            Doesnt exist loser
        </div>)
    }
    if (isProcessing(receipt)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Processing your receipt...</p>
                <Button variant="outline" size="sm">Process Again</Button>
            </div>
        )
    }

    if (isFailed(receipt)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-4">
                <div className="text-center">
                    <p className="text-lg font-semibold mb-2">Processing Failed</p>
                    <p className="text-sm text-muted-foreground">
                        Failed after {receipt.attempts} attempts
                    </p>
                </div>
                <Button>Try Again</Button>
            </div>
        )
    }

    const subtotal = receipt.items
        .reduce((sum, item) => sum + item.price, 0)
        .toFixed(2);

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="container max-w-2xl mx-auto px-4 py-6 md:py-12">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Receipt className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">Review Receipt</h1>
                            <p className="text-sm text-muted-foreground">
                                {receipt.items.length} items • ${subtotal}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Items Grid */}
                <div className="space-y-2 mb-4">
                    {receipt.items.map((item, index) => (
                        <ReceiptItemCard
                            key={index}
                            item={item}
                            onEdit={() => {/* TODO: Open edit modal */ }}
                        />
                    ))}
                </div>

                {/* Add Item Button */}
                <Button
                    variant="outline"
                    className="w-full mb-6 border-dashed"
                    onClick={() => {/* TODO: Add custom item */ }}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Item
                </Button>

                {/* Summary Card */}
                <Card className="mb-6 md:mb-0 py-0 gap-0 overflow-hidden">
                    <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 border-b">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Parsed Subtotal</span>
                            <span className="text-2xl font-bold">${receipt.subtotal?.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Computed Subtotal</span>
                            <span className="text-2xl font-bold">${subtotal}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Tip</span>
                            <span className="text-2xl font-bold">${receipt.tip?.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Tax</span>
                            <span className="text-2xl font-bold">${receipt.tax?.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Grand Total</span>
                            <span className="text-2xl font-bold">${receipt.grandTotal?.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Tax & tip will be split proportionally
                        </p>
                    </div>
                    <div className="p-4">
                        <Button
                            className="w-full h-11"
                            onClick={() => setIsCreatingRoom(true)}
                            disabled={isCreatingRoom}
                        >
                            {isCreatingRoom ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating Room...
                                </>
                            ) : (
                                <>
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Create Split Room
                                </>
                            )}
                        </Button>
                    </div>
                </Card>

                {/* Mobile bottom padding for fixed button alternative */}
                <div className="h-4 md:hidden" />
            </div>
        </div>
    )
}
