import { createFileRoute } from '@tanstack/react-router'
import { getReceipt } from '@/server/get-receipt/rpc-get-receipt'
import { isFailed, isProcessing } from '@/lib/receipt-utils'
import { ReceiptItemCard } from '@/components/receipt-item-card'

export const Route = createFileRoute('/receipts/review/$receiptId')({
    loader: async ({ params }) => {
        return await getReceipt({ data: params.receiptId })
    },
    component: RouteComponent,
})

function RouteComponent() {
    const receipt = Route.useLoaderData()
    if (isProcessing(receipt)) {
        return <div>Want to process again this thing sucks</div>
    }
    if (isFailed(receipt)) {
        return <div>This thing has failed {receipt.attempts} times</div>
    }
    return (
        <div>Receipt: {receipt && receipt.items.map((item) => (
            <ReceiptItemCard item={item} />
        ))}</div>)
}
