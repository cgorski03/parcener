import { createFileRoute, notFound } from '@tanstack/react-router'
import { isFailed, isProcessing, receiptNotFound } from '@/lib/receipt-utils'
import {
    ErrorReceiptView,
    ProcessingReceiptView,
    ReceiptEditorView,
} from '@/components/review/views'
import { ReviewNotFound } from '@/components/layout/not-found'
import { useGetReceiptReview } from '@/hooks/use-get-receipt'
import { AppHeader } from '@/components/layout/app-header'

export const Route = createFileRoute('/_authed/receipt/review/$receiptId')({
    component: RouteComponent,
    notFoundComponent: ReviewNotFound,
})

function RouteComponent() {
    const { receiptId } = Route.useParams()
    const { data: receipt, isFetching } = useGetReceiptReview(receiptId);

    if (isFetching && !receipt) {

        return (<>
            <AppHeader />
            <ProcessingReceiptView isPolling={isFetching} />
        </>)
    }

    if (!receipt || receiptNotFound(receipt)) {
        throw notFound();
    }

    if (isProcessing(receipt)) {
        return (<>
            <AppHeader />
            <ProcessingReceiptView isPolling={isFetching} />
        </>)
    }

    if (isFailed(receipt)) {
        return (
            <>
                <AppHeader />
                <ErrorReceiptView attempts={receipt.attempts} />
            </>
        )
    }

    // 3. Render the Success View
    return <ReceiptEditorView key={receipt.receiptId} receipt={receipt} />
}
