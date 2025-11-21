import { createFileRoute, notFound } from '@tanstack/react-router'
import { getReceiptRpc } from '@/server/get-receipt/rpc-get-receipt'
import { isFailed, isProcessing, receiptNotFound } from '@/lib/receipt-utils'
import { Button } from '@/components/ui/button'
import { Plus, Share2, Loader2, AlertCircle } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import ReceiptItemSheet from '@/components/edit-item-sheet'
import { ReceiptItemDto } from '@/server/dtos'
import { ReceiptSummarySheet } from '@/components/receipt-summary-sheet'
import { ReviewReceiptHeader } from '@/components/review/receipt-header'
import { ErrorReceipt, ProcessingReceipt } from '@/components/processing-errors'
import { useGetReceiptReview, useReceiptIsValid } from '@/hooks/useGetReceipt'
import { useCreateReceiptItem, useDeleteReceiptItem, useEditReceiptItem } from '@/hooks/useEditReceipt'
import { useCreateReceiptRoom } from '@/hooks/useRoom'
import { ReceiptLayoutShell } from '@/components/layout/receipt-layout-shell'
import { ReviewItemCard } from '@/components/item-card/review-item-card'
import { PriceBreakdown } from '@/components/price-breakdown'

export const Route = createFileRoute('/receipt/review/$receiptId')({
    loader: async ({ params }) => {
        const receipt = await getReceiptRpc({ data: params.receiptId })
        if (!receipt) throw notFound();
        return receipt;
    },
    component: RouteComponent,
})



function RouteComponent() {
    const receiptInfoFromServer = Route.useLoaderData()
    const { receiptId } = Route.useParams();

    const { data: receipt } = useGetReceiptReview(receiptId, receiptInfoFromServer);
    const { isError: receiptNotValid, isFetching: receiptValidFetching } = useReceiptIsValid(receiptId);

    if (receipt == null || receiptNotFound(receipt)) {
        throw notFound();
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
    const { mutateAsync: createReceiptRoom, isPending: createReceiptRoomLoading } = useCreateReceiptRoom();


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

    const handleCreateReceiptRoom = () => {
        if (receiptNotValid) {
            console.error('client tried to create receipt room for an invalid receipt');
        }
        createReceiptRoom(receiptId);
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
        <ReceiptLayoutShell
            header={
                <ReviewReceiptHeader
                    title={receipt.title ?? "Set Title"}
                    itemCount={receiptItems.length}
                    grandTotal={receipt.grandTotal ?? 0}
                    receiptIsInvalid={receiptNotValid}
                    receiptIsValidPending={receiptValidFetching}
                />
            }>

            {/* Items Grid */}
            <div className="space-y-2 mb-4">
                {receiptItems.map((item) => (
                    <ReviewItemCard
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
            <PriceBreakdown
                subtotal={parseFloat(subtotal)}
                tax={receipt.tax ?? 0}
                tip={receipt.tip ?? 0}
                grandTotal={receipt.grandTotal ?? 0}
                label="Receipt Totals"
                onClick={() => setShowSummarySheet(true)}
                className="mt-6"
            />

            {/* Create Room Actions */}
            <div className=" space-y-3">
                {totalHasError && (
                    <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>Click on the total above to resolve issues with grand total calculation</span>
                    </div>
                )}
                <Button
                    className="w-full h-11"
                    disabled={totalHasError}
                    onClick={handleCreateReceiptRoom}
                >
                    {createReceiptRoomLoading ? (
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

            {/* Mobile bottom padding for fixed button alternative */}
            <div className="h-4 md:hidden" />
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
        </ReceiptLayoutShell >
    )
}
