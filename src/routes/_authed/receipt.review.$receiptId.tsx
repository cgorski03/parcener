import { createFileRoute, notFound } from '@tanstack/react-router';
import { paymentMethodsOptions } from '@/features/payment-methods/hooks/use-payment-methods';
import { ReviewNotFound } from '@/shared/components/layout/not-found';
import { AppHeader } from '@/shared/components/layout/app-header';
import {
  receiptOptions,
  useGetReceiptReview,
} from '@/features/receipt-review/hooks/use-get-receipt';
import {
  isFailed,
  isProcessing,
  receiptNotFound,
} from '@/features/receipt-review/lib/receipt-utils';
import { ReceiptEditorView } from '@/features/receipt-review/components/editor-view';
import { ProcessingReceiptView } from '@/features/receipt-review/components/processing-view';
import { ErrorReceiptView } from '@/features/receipt-review/components/error-view';
import ReceiptReviewLoadingView from '@/features/receipt-review/components/loading-view';

type ReviewSearch = { view?: 'items' | 'image' };
export const Route = createFileRoute('/_authed/receipt/review/$receiptId')({
  head: () => ({
    meta: [
      { title: 'Review Receipt | Parcener' },
      { property: 'og:title', content: `Review Receipt | Parcener` },
    ],
  }),
  validateSearch: (search: ReviewSearch) => {
    return { view: search.view === 'items' ? 'items' : 'image' };
  },
  loader: async ({ context, params }) => {
    // 1. Fetch data in parallel
    await Promise.all([
      context.queryClient.ensureQueryData(receiptOptions(params.receiptId)),
      context.queryClient.ensureQueryData(paymentMethodsOptions()),
    ]);
  },
  component: ReceiptReviewComponent,
  notFoundComponent: ReviewNotFound,
});

function ReceiptReviewComponent() {
  const { receiptId } = Route.useParams();
  const { data: receipt, isFetching } = useGetReceiptReview(receiptId);

  // 3. Guard: Initial Loading State
  // We check receipt && isFetching to avoid a flicker if data is already cached
  if (!receipt && isFetching) {
    return <ReceiptReviewLoadingView isFetching={isFetching} />;
  }

  // 4. Guard: Not Found or Invalid State
  if (!receipt || receiptNotFound(receipt)) {
    throw notFound();
  }

  // 5. Route Based on Status
  if (!isProcessing(receipt) && !isFailed(receipt)) {
    // Success State -> Editor
    return (
      <ReceiptEditorView key={receipt.receiptId} initialReceipt={receipt} />
    );
  }

  // 6. Status Views: Processing or Failed
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <AppHeader />

      {isProcessing(receipt) ? (
        <ProcessingReceiptView isPolling={isFetching} />
      ) : (
        <div className="flex-1 h-full">
          <ErrorReceiptView attempts={receipt.attempts} />
        </div>
      )}
    </div>
  );
}
