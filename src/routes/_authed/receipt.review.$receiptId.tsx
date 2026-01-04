import { ReceiptEditorView } from '@/features/receipt-review/components/editor-view';
import { ErrorReceiptView } from '@/features/receipt-review/components/error-view';
import { ProcessingReceiptView } from '@/features/receipt-review/components/processing-view';
import { useGetReceiptReview } from '@/features/receipt-review/hooks/use-get-receipt';
import { isFailed, isProcessing, receiptNotFound } from '@/features/receipt-review/lib/receipt-utils';
import { AppHeader } from '@/shared/components/layout/app-header';
import { ReviewNotFound } from '@/shared/components/layout/not-found';
import { createFileRoute, notFound } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/receipt/review/$receiptId')({
    head: () => ({
        meta: [
            { title: 'Review Receipt | Parcener' },
            { property: 'og:title', content: `Review Receipt | Parcener` },
        ],
    }),
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
    return <ReceiptEditorView key={receipt.receiptId} initialReceipt={receipt} />
}
