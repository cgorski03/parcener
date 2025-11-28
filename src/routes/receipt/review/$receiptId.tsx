import { createFileRoute, notFound } from '@tanstack/react-router'
import { getReceiptRpc } from '@/server/get-receipt/rpc-get-receipt'
import { isFailed, isProcessing, receiptNotFound } from '@/lib/receipt-utils'
import { useGetReceiptReview } from '@/hooks/useGetReceipt'
import {
    ErrorReceiptView,
    ProcessingReceiptView,
    ReceiptEditorView,
} from '@/components/review/views'
import { ReviewNotFound } from '@/components/layout/not-found'

export const Route = createFileRoute('/receipt/review/$receiptId')({
    loader: async ({ params }) => {
        const receipt = await getReceiptRpc({ data: params.receiptId })
        if (!receipt || receiptNotFound(receipt)) {
            console.log('Thorwing the not found')
            throw notFound()
        }
        return receipt
    },
    component: RouteComponent,
    notFoundComponent: ReviewNotFound,
})

function RouteComponent() {
    const receiptInfoFromServer = Route.useLoaderData()
    const { receiptId } = Route.useParams()

    const { data: receipt, isFetching } = useGetReceiptReview(
        receiptId,
        receiptInfoFromServer,
    )

    if (!receipt || receiptNotFound(receipt)) {
        throw notFound()
    }

    if (isProcessing(receipt)) {
        return <ProcessingReceiptView isPolling={isFetching} />
    }

    if (isFailed(receipt)) {
        return <ErrorReceiptView attempts={receipt.attempts} />
    }

    // 3. Render the Success View
    return <ReceiptEditorView key={receipt.receiptId} receipt={receipt} />
}
