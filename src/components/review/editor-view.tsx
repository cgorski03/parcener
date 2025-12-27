import { Pencil, Plus, Share2, Users } from 'lucide-react'
import type { CreateReceiptItemDto, ReceiptItemDto } from '@/server/dtos'
import { Link, useNavigate } from '@tanstack/react-router'
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
import { usePaymentMethods } from '@/hooks/use-payment-methods'
import { CreateRoomSheet } from './create-room-sheet'
import { useGetReceiptReview } from '@/hooks/use-get-receipt'


interface ReceiptEditorProps {
    initialReceipt: ReceiptWithRoom
}

export function ReceiptEditorView({ initialReceipt }: ReceiptEditorProps) {
    const navigate = useNavigate()
    const { data } = useGetReceiptReview(initialReceipt.receiptId, {
        initialData: initialReceipt
    });
    const receipt = (data && 'items' in data) ? (data as ReceiptWithRoom) : initialReceipt;
    const receiptItems = receipt.items || [];
    // --- DATA HOOKS ---
    const { isError: receiptNotValid, isFetching: receiptValidFetching } =
        useReceiptIsValid(receipt.receiptId)
    const { data: myPaymentMethods } = usePaymentMethods()

    // --- UI STATE ---
    const [showingItemSheet, setShowingItemSheet] = useState(false)
    const [showSummarySheet, setShowSummarySheet] = useState(false)
    const [showCreateRoomSheet, setShowCreateRoomSheet] = useState(false)
    const [receiptItemForSheet, setReceiptItemForSheet] = useState<ReceiptItemDto | null>(null)

    // --- MUTATIONS ---
    const { mutateAsync: editReceiptItem } = useEditReceiptItem(receipt.receiptId, receipt.roomId ?? null)
    const { mutateAsync: deleteReceiptItem } = useDeleteReceiptItem(receipt.roomId ?? null)
    const { mutateAsync: createReceiptItem } = useCreateReceiptItem(receipt.roomId ?? null)
    const { mutateAsync: createReceiptRoom, isPending: isCreatingRoom } = useCreateReceiptRoom()

    const defaultPaymentMethod = myPaymentMethods?.find(pm => pm.isDefault) || myPaymentMethods?.[0];

    // --- CALCULATIONS ---
    const subtotal = useMemo(() => {
        return receiptItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)
    }, [receiptItems])

    const totalHasError = useMemo(() => {
        const epsilon = 0.01
        const calculated = Number(subtotal) + (receipt.tip ?? 0) + (receipt.tax ?? 0)
        return Math.abs(calculated - (receipt.grandTotal ?? 0)) >= epsilon
    }, [subtotal, receipt])

    // --- HANDLERS ---
    // (Notice: No more setReceiptItems logic. Just clean mutation calls)

    const handleCreateCustomItem = () => {
        setReceiptItemForSheet(null)
        setShowingItemSheet(true)
    }

    const handleEditItem = (item: ReceiptItemDto) => {
        setReceiptItemForSheet(item)
        setShowingItemSheet(true)
    }

    const handleDeleteItem = async (updatedItem: ReceiptItemDto) => {
        setShowingItemSheet(false)
        await deleteReceiptItem({ receiptId: receipt.receiptId, item: updatedItem })
    }

    const saveReceiptItem = async (updatedItem: ReceiptItemDto | CreateReceiptItemDto) => {
        setShowingItemSheet(false)
        if ('receiptItemId' in updatedItem) {
            await editReceiptItem(updatedItem)
        } else {
            await createReceiptItem({ receiptId: receipt.receiptId, item: updatedItem })
        }
    }

    const handleFinalizeRoomCreation = async (sharePayment: boolean) => {
        const response = await createReceiptRoom({
            receiptId: receipt.receiptId,
            sharePayment
        });

        if ('success' in response && 'room' in response) {
            setShowCreateRoomSheet(false)
            navigate({
                to: '/receipt/parce/$roomId',
                params: { roomId: response.room.id },
                search: { view: 'items' }
            })
        }
    }

    // --- COMPONENTS ---
    const ActionButton = () => {
        if (totalHasError) {
            return (
                <Button className="w-full h-11" size="lg" onClick={() => setShowingItemSheet(true)}>
                    <Pencil className="size-4 mr-2" />
                    Edit Receipt Totals
                </Button>
            )
        }

        if (receipt.roomId) {
            return (
                <Link to='/receipt/parce/$roomId' params={{ roomId: receipt.roomId }} search={{ view: 'items' }}>
                    <Button className="w-full h-11" size="lg">
                        <Users className="size-4 mr-2" />
                        Go To Room
                    </Button>
                </Link>
            )
        }

        return (
            <Button
                className="w-full h-11"
                size="lg"
                disabled={receiptNotValid}
                onClick={() => setShowCreateRoomSheet(true)}
            >
                <Share2 className="size-4 mr-2" />
                Create Room
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
                size="lg"
                className="w-full mb-6 border-dashed"
                onClick={handleCreateCustomItem}
            >
                <Plus className="size-4 mr-2" />
                Add Custom Item
            </Button>

            <div className="relative group mt-6 pb-20">
                <PriceBreakdown
                    subtotal={parseFloat(subtotal)}
                    tax={receipt.tax ?? 0}
                    tip={receipt.tip ?? 0}
                    grandTotal={receipt.grandTotal ?? 0}
                    label="Receipt Totals"
                    onClick={() => setShowSummarySheet(true)}
                    errorMessage={totalHasError ? "Fix total mismatch before continuing" : undefined}
                    actionButton={<ActionButton />}
                    className="pr-10 border-primary/20 active:bg-accent/50 transition-colors shadow-sm"
                />

                <div className="absolute top-4 right-4 pointer-events-none">
                    <div className="bg-primary/10 p-2 rounded-full text-primary">
                        <Pencil className="size-4" />
                    </div>
                </div>
            </div>

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

            <CreateRoomSheet
                open={showCreateRoomSheet}
                onOpenChange={setShowCreateRoomSheet}
                onConfirm={handleFinalizeRoomCreation}
                receiptTip={receipt.tip ?? 0}
                isCreating={isCreatingRoom}
                defaultPaymentMethod={defaultPaymentMethod}
            />
        </ReceiptLayoutShell>
    )
}
