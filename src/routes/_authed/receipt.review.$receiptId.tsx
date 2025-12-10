import { createFileRoute, notFound } from '@tanstack/react-router'
import { isFailed, isProcessing, receiptNotFound } from '@/lib/receipt-utils'
import { useGetReceiptReview } from '@/hooks/useGetReceipt'
import {
    ErrorReceiptView,
    ProcessingReceiptView,
    ReceiptEditorView,
} from '@/components/review/views'
import { ReviewNotFound } from '@/components/layout/not-found'

export const Route = createFileRoute('/_authed/receipt/review/$receiptId')({
    component: RouteComponent,
    notFoundComponent: ReviewNotFound,
})

function RouteComponent() {
    const { receiptId } = Route.useParams()
    const { data: receipt, isFetching } = useGetReceiptReview(receiptId);

    if (!receipt || receiptNotFound(receipt)) {
        throw notFound();
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
