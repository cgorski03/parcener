import { createFileRoute } from '@tanstack/react-router'
import { getReceiptRpc } from '@/server/get-receipt/rpc-get-receipt'
import { isFailed, isProcessing, receiptNotFound } from '@/lib/receipt-utils'
import { ReceiptItemCard } from '@/components/receipt-item-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Share2, Loader2, AlertCircle } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import ReceiptItemSheet from '@/components/edit-item-sheet'
import { ReceiptItemDto } from '@/server/dtos'
import { ReceiptSummarySheet } from '@/components/receipt-summary-sheet'
import { ReviewReceiptHeader } from '@/components/review/receipt-header'
import { ErrorReceipt, NotFoundReceipt, ProcessingReceipt } from '@/components/processing-errors'
import { useGetReceiptReview, useReceiptIsValid } from '@/hooks/useGetReceipt'
import { useCreateReceiptItem, useDeleteReceiptItem, useEditReceiptItem } from '@/hooks/useEditReceipt'

export const Route = createFileRoute('/receipt/review/$receiptId')({
    loader: async ({ params }) => {
        return await getReceiptRpc({ data: params.receiptId })
    },
    component: RouteComponent,
})



function RouteComponent() {
    const receiptInfoFromServer = Route.useLoaderData()
    const { receiptId } = Route.useParams();

    const { data: receipt } = useGetReceiptReview(receiptId, receiptInfoFromServer);
    const { isError: receiptNotValid, isFetching: receiptValidFetching } = useReceiptIsValid(receiptId);

    if (receipt == null || receiptNotFound(receipt)) {
        return <NotFoundReceipt />
    }
    if (isProcessing(receipt)) {
        return <ProcessingReceipt />
    }
    if (isFailed(receipt)) {
        return <ErrorReceipt attempts={receipt.attempts} />;
    }
    // Enable optimistic updates
    const [receiptItems, setReceiptItems] = useState(receipt.items);

    // Component state
    const [showingItemSheet, setShowingItemSheet] = useState<boolean>(false);
    const [showSummarySheet, setShowSummarySheet] = useState<boolean>(false);
    const [receiptItemForSheet, setReceiptItemForSheet] = useState<ReceiptItemDto | null>(null);

    const { mutateAsync: editReceiptItem } = useEditReceiptItem(receiptId);
    const { mutateAsync: deleteReceiptItem } = useDeleteReceiptItem();
    const { mutateAsync: createReceiptItem } = useCreateReceiptItem();

    const handleDeleteItem = async (updatedItem: ReceiptItemDto) => {
        // Optimistically update
        setReceiptItems(receiptItems.filter(i =>
            i.id !== updatedItem.id
        ));
        closeSheet();
        deleteReceiptItem({ id: receiptId, item: updatedItem }, {
            onError: () => setReceiptItems(receipt.items)
        });
    };

    const saveReceiptItem = async (updatedItem: ReceiptItemDto, isCreated: boolean) => {
        closeSheet();
        if (isCreated) {
            setReceiptItems([...receiptItems, updatedItem]);
            createReceiptItem({ id: receiptId, item: updatedItem });
        } else {
            setReceiptItems(receiptItems.map(i =>
                i.id === updatedItem.id
                    ? updatedItem
                    : i
            ));
            editReceiptItem(updatedItem, {
                onError: () => setReceiptItems(receipt.items)
            });
        }
    };

    const handleCreateCustomItem = () => {
        setShowingItemSheet(true);
        setReceiptItemForSheet(null);
    };

    const handleEditItem = useCallback((item: ReceiptItemDto) => {
        setReceiptItemForSheet(item);
        setShowingItemSheet(true);
    }, []);

    const closeSheet = useCallback(() => {
        setShowingItemSheet(false);
        setReceiptItemForSheet(null);
    }, []);

    const subtotal = useMemo(() => {
        return receiptItems
            .reduce((sum, item) => sum + item.price, 0)
            .toFixed(2);
    }, [receiptItems]);


    const totalHasError = useMemo(() => {
        const epsilon = 0.01;
        const calculated = Number(subtotal) + (receipt.tip ?? 0) + (receipt.tax ?? 0);
        return Math.abs(calculated - (receipt.grandTotal ?? 0)) >= epsilon;
    }, [subtotal, receipt])

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <ReviewReceiptHeader
                title={receipt.title ?? "Set Title"}
                itemCount={receiptItems.length}
                grandTotal={receipt.grandTotal ?? 0}
                receiptIsInvalid={receiptNotValid}
                receiptIsValidPending={receiptValidFetching}
            />
            <div className="container max-w-2xl mx-auto px-4 py-6 md:py-12">
                {/* Header */}

                {/* Items Grid */}
                <div className="space-y-2 mb-4">
                    {receiptItems.map((item) => (
                        <ReceiptItemCard
                            key={item.id}
                            item={item}
                            onEdit={() => handleEditItem(item)}
                        />
                    ))}
                </div>

                {/* Add Item Button */}
                <Button
                    variant="outline"
                    className="w-full mb-6 border-dashed"
                    onClick={handleCreateCustomItem}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Item
                </Button>

                {/* Summary Card */}
                <Card className="mb-6 md:mb-0 py-0 gap-0 overflow-hidden">
                    <button
                        onClick={() => setShowSummarySheet(true)}
                        className="w-full bg-gradient-to-br from-primary/5 to-primary/10 p-4 border-b rounded-t-lg text-left hover:from-primary/10 hover:to-primary/15 transition-all h-auto"
                    >
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
                    </button>
                    {/* Create Room Button */}
                    <div className="p-4 space-y-3">
                        <Button
                            className="w-full h-11"
                            disabled={totalHasError}
                        >
                            {false ? (
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
                        {totalHasError && (
                            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>Click on the total above to resolve issues with grand total calculation</span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Mobile bottom padding for fixed button alternative */}
                <div className="h-4 md:hidden" />
            </div >
            <ReceiptItemSheet
                key={receiptItemForSheet?.id}
                item={receiptItemForSheet}
                showSheet={showingItemSheet}
                closeSheet={closeSheet}
                handleDeleteItem={handleDeleteItem}
                handleSaveItem={saveReceiptItem} />
            <ReceiptSummarySheet
                showSheet={showSummarySheet}
                receipt={receipt}
                subtotal={subtotal}
                closeSheet={() => setShowSummarySheet(false)}
            />
        </div >
    )
}
