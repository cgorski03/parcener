import { Loader2, Pencil, Plus, Share2, Users } from 'lucide-react'
import { ReceiptItemDto } from '@/server/dtos'
import { Link, notFound, useNavigate } from '@tanstack/react-router'
import { useReceiptIsValid } from '@/hooks/use-get-receipt'
import { useMemo, useState } from 'react'
import {
    useCreateReceiptItem,
    useDeleteReceiptItem,
    useEditReceiptItem,
} from '@/hooks/use-edit-receipt'
import { useCreateReceiptRoom } from '@/hooks/use-room'
import { Button } from '../ui/button'
import { ReceiptLayoutShell } from '../layout/receipt-layout-shell'
import { ReviewReceiptHeader } from './receipt-header'
import { ReviewItemCard } from '../item-card/review-item-card'
import { PriceBreakdown } from '../price-breakdown'
import { ReceiptSummarySheet } from './receipt-summary-sheet'
import ReceiptItemSheet from './edit-item-sheet'
import { ReceiptWithRoom } from '@/server/get-receipt/get-receipt-service'

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

interface ProcessingReceiptViewProps {
    isPolling: boolean;
}

export function ProcessingReceiptView({ isPolling }: ProcessingReceiptViewProps) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border border-border bg-card p-8 shadow-sm">
                <Loader2
                    className={`h-10 w-10 animate-spin text-primary transition-opacity duration-500 ${isPolling ? 'opacity-90' : 'opacity-70'
                        }`}
                />

                <div className="text-center space-y-1.5">
                    <p className="text-base font-medium text-card-foreground">
                        Processing your receipt...
                    </p>
                    <p className="text-sm text-muted-foreground">
                        This may take a few moments
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                        It is safe to leave this page and come back
                    </p>
                </div>
            </div>
        </div>
    );
}

interface ReceiptEditorProps {
    receipt: ReceiptWithRoom
}

export function ReceiptEditorView({ receipt }: ReceiptEditorProps) {
    if (!receipt) throw notFound()
    const navigate = useNavigate()
    // Validation Hook
    const { isError: receiptNotValid, isFetching: receiptValidFetching } =
        useReceiptIsValid(receipt.receiptId)

    // State initialization is now 100% type-safe
    const [receiptItems, setReceiptItems] = useState(receipt.items)

    // UI State
    const [showingItemSheet, setShowingItemSheet] = useState(false)
    const [showSummarySheet, setShowSummarySheet] = useState(false)
    const [receiptItemForSheet, setReceiptItemForSheet] =
        useState<ReceiptItemDto | null>(null)

    // Mutation Hooks
    const { mutateAsync: editReceiptItem } = useEditReceiptItem(receipt.receiptId, receipt.roomId ?? null)
    const { mutateAsync: deleteReceiptItem } = useDeleteReceiptItem(receipt.roomId ?? null)
    const { mutateAsync: createReceiptItem } = useCreateReceiptItem(receipt.roomId ?? null)
    const {
        mutateAsync: createReceiptRoom,
        isPending: createReceiptRoomLoading,
    } = useCreateReceiptRoom()

    const subtotal = useMemo(() => {
        return receiptItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)
    }, [receiptItems])

    const totalHasError = useMemo(() => {
        const epsilon = 0.01
        const calculated =
            Number(subtotal) + (receipt.tip ?? 0) + (receipt.tax ?? 0)
        return Math.abs(calculated - (receipt.grandTotal ?? 0)) >= epsilon
    }, [subtotal, receipt])

    const handleCreateCustomItem = () => {
        setReceiptItemForSheet(null)
        setShowingItemSheet(true)
    }

    const handleEditItem = (item: ReceiptItemDto) => {
        setReceiptItemForSheet(item)
        setShowingItemSheet(true)
    }

    const handleDeleteItem = async (updatedItem: ReceiptItemDto) => {
        setReceiptItems((prev) => prev.filter((i) => i.receiptItemId !== updatedItem.receiptItemId))
        setShowingItemSheet(false)
        deleteReceiptItem(
            { receiptId: receipt.receiptId, item: updatedItem },
            {
                onError: () => setReceiptItems(receipt.items),
            },
        )
    }

    const saveReceiptItem = async (
        updatedItem: ReceiptItemDto,
        isCreated: boolean,
    ) => {
        setShowingItemSheet(false)
        if (isCreated) {
            setReceiptItems((prev) => [...prev, updatedItem])
            createReceiptItem({ receiptId: receipt.receiptId, item: updatedItem })
        } else {
            setReceiptItems((prev) =>
                prev.map((i) => (i.receiptItemId === updatedItem.receiptItemId ? updatedItem : i)),
            )
            editReceiptItem(updatedItem, {
                onError: () => setReceiptItems(receipt.items),
            })
        }
    }

    const handleCreateReceiptRoom = async () => {
        if (receiptNotValid) return;
        const response = await createReceiptRoom(receipt.receiptId);
        if ('success' in response) {
            navigate({
                to: '/receipt/parce/$roomId',
                params: { roomId: response.room.id },
                search: { view: 'items' }
            });
        }
    }
    const ActionButton = () => {
        if (totalHasError) {
            return (
                <Button
                    className="w-full h-11"
                    onClick={() => setShowingItemSheet(true)}
                >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Receipt Totals
                </Button>);
        }

        if (receipt.roomId) {
            return (
                <Link to='/receipt/parce/$roomId' params={{ roomId: receipt.roomId }} search={{ view: 'items' }}>
                    <Button className="w-full h-11">
                        <Users className="h-4 w-4 mr-2" />
                        Go To Room
                    </Button>
                </Link>
            )
        }

        return (
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
        )
    }
    return (
        <ReceiptLayoutShell
            header={
                <ReviewReceiptHeader
                    title={receipt.title ?? 'Set Title'}
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
                        key={item.receiptItemId}
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

            <div className="relative group mt-6">
                <PriceBreakdown
                    subtotal={parseFloat(subtotal)}
                    tax={receipt.tax ?? 0}
                    tip={receipt.tip ?? 0}
                    grandTotal={receipt.grandTotal ?? 0}
                    label="Receipt Totals"
                    onClick={() => setShowSummarySheet(true)}
                    errorMessage={totalHasError ? "Fix total mismatch before continuing" : undefined}
                    actionButton={<ActionButton />}
                    className="pr-10 border-primary/20 active:bg-accent/50 transition-colors"
                />

                {/* Floating Edit Icon Overlay */}
                {/* Goal here is to make it clear that this is not view-only*/}
                <div className="absolute top-4 right-4 pointer-events-none">
                    <div className="bg-primary/10 p-2 rounded-full text-primary">
                        <Pencil className="w-4 h-4" />
                    </div>
                </div>
            </div>

            <div className="h-4 md:hidden" />

            <ReceiptItemSheet
                key={receiptItemForSheet?.receiptItemId}
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
    )
}
