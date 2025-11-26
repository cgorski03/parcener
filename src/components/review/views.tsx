import { AlertCircle, Loader2, Plus, Share2 } from "lucide-react";
import { ReceiptDto, ReceiptItemDto } from "@/server/dtos";
import { notFound, useRouter } from "@tanstack/react-router";
import { useReceiptIsValid } from "@/hooks/useGetReceipt";
import { useMemo, useState } from "react";
import { useCreateReceiptItem, useDeleteReceiptItem, useEditReceiptItem } from "@/hooks/useEditReceipt";
import { useCreateReceiptRoom } from "@/hooks/useRoom";
import { Button } from "../ui/button";
import { ReceiptLayoutShell } from "../layout/receipt-layout-shell";
import { ReviewReceiptHeader } from "./receipt-header";
import { ReviewItemCard } from "../item-card/review-item-card";
import { PriceBreakdown } from "../price-breakdown";
import { ReceiptSummarySheet } from "../receipt-summary-sheet";
import ReceiptItemSheet from "../edit-item-sheet";

export function ErrorReceiptView(props: { attempts: number }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-4">
            <div className="text-center">
                <p className="text-lg font-semibold mb-2">Processing Failed</p>
                <p className="text-sm text-muted-foreground">
                    Failed after {props.attempts} attempts
                </p>
            </div>
            <Button>Try Again</Button>
        </div>
    )
}


export function ProcessingReceiptView(props: { isPolling: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Processing your receipt...</p>
        </div>
    )
}

interface ReceiptEditorProps {
    receipt: ReceiptDto;
}

export function ReceiptEditorView({ receipt }: ReceiptEditorProps) {
    if (!receipt) throw notFound();
    const router = useRouter();
    // Validation Hook
    const { isError: receiptNotValid, isFetching: receiptValidFetching } = useReceiptIsValid(receipt.id);

    // State initialization is now 100% type-safe
    const [receiptItems, setReceiptItems] = useState(receipt.items);

    // UI State
    const [showingItemSheet, setShowingItemSheet] = useState(false);
    const [showSummarySheet, setShowSummarySheet] = useState(false);
    const [receiptItemForSheet, setReceiptItemForSheet] = useState<ReceiptItemDto | null>(null);

    // Mutation Hooks
    const { mutateAsync: editReceiptItem } = useEditReceiptItem(receipt.id);
    const { mutateAsync: deleteReceiptItem } = useDeleteReceiptItem();
    const { mutateAsync: createReceiptItem } = useCreateReceiptItem();
    const { mutateAsync: createReceiptRoom, isPending: createReceiptRoomLoading } = useCreateReceiptRoom();

    const subtotal = useMemo(() => {
        return receiptItems
            .reduce((sum, item) => sum + item.price, 0)
            .toFixed(2);
    }, [receiptItems]);

    const totalHasError = useMemo(() => {
        const epsilon = 0.01;
        const calculated = Number(subtotal) + (receipt.tip ?? 0) + (receipt.tax ?? 0);
        return Math.abs(calculated - (receipt.grandTotal ?? 0)) >= epsilon;
    }, [subtotal, receipt]);

    const handleCreateCustomItem = () => {
        setReceiptItemForSheet(null);
        setShowingItemSheet(true);
    };

    const handleEditItem = (item: ReceiptItemDto) => {
        setReceiptItemForSheet(item);
        setShowingItemSheet(true);
    };

    const handleDeleteItem = async (updatedItem: ReceiptItemDto) => {
        setReceiptItems(prev => prev.filter(i => i.id !== updatedItem.id));
        setShowingItemSheet(false);
        deleteReceiptItem({ id: receipt.id, item: updatedItem }, {
            onError: () => setReceiptItems(receipt.items)
        });
    };

    const saveReceiptItem = async (updatedItem: ReceiptItemDto, isCreated: boolean) => {
        setShowingItemSheet(false);
        if (isCreated) {
            setReceiptItems(prev => [...prev, updatedItem]);
            createReceiptItem({ id: receipt.id, item: updatedItem });
        } else {
            setReceiptItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
            editReceiptItem(updatedItem, {
                onError: () => setReceiptItems(receipt.items)
            });
        }
    };

    const handleCreateReceiptRoom = async () => {
        if (receiptNotValid) return;
        const response = await createReceiptRoom(receipt.id);
        if ('success' in response) {
            router.navigate({
                to: '/receipt/parce/$roomId',
                params: { roomId: response.room.id }
            });
        }
    };

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
            }
        >
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

            <Button
                variant="outline"
                className="w-full mb-6 border-dashed"
                onClick={handleCreateCustomItem}
            >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Item
            </Button>

            <PriceBreakdown
                subtotal={parseFloat(subtotal)}
                tax={receipt.tax ?? 0}
                tip={receipt.tip ?? 0}
                grandTotal={receipt.grandTotal ?? 0}
                label="Receipt Totals"
                onClick={() => setShowSummarySheet(true)}
                className="mt-6"
            />

            <div className="space-y-3">
                {totalHasError && (
                    <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>Fix total mismatch before continuing</span>
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

            <div className="h-4 md:hidden" />

            <ReceiptItemSheet
                key={receiptItemForSheet?.id}
                item={receiptItemForSheet}
                showSheet={showingItemSheet}
                closeSheet={() => setShowingItemSheet(false)}
                handleDeleteItem={handleDeleteItem}
                handleSaveItem={saveReceiptItem}
            />
            <ReceiptSummarySheet
                showSheet={showSummarySheet}
                receipt={receipt}
                subtotal={subtotal}
                closeSheet={() => setShowSummarySheet(false)}
            />
        </ReceiptLayoutShell>
    );
}
