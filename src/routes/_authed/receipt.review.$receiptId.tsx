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
    return { view: search.view === 'image' ? 'image' : 'items' } as {
      view: 'image' | 'items';
    };
  },
  loader: async ({ context, params }) => {
    const [receipt] = await Promise.all([
      context.queryClient.ensureQueryData(receiptOptions(params.receiptId)),
      context.queryClient.ensureQueryData(paymentMethodsOptions()),
    ]);

    if (receiptNotFound(receipt)) {
      throw notFound();
    }

    if (isProcessing(receipt)) {
      return { state: 'processing' };
    }

    if (isFailed(receipt)) {
      return { state: 'failed', attempts: receipt.attempts };
    }

    return { state: 'ready', receipt };
  },
  component: ReceiptReviewComponent,
  notFoundComponent: ReviewNotFound,
});

function ReceiptReviewComponent() {
  const { receiptId } = Route.useParams();
  const loaderData = Route.useLoaderData();

  if (loaderData.state === 'ready') {
    return (
      <ReceiptEditorView
        key={loaderData.receipt.receiptId}
        initialReceipt={loaderData.receipt}
      />
    );
  }

  return (
    <ReceiptReviewStatusGate receiptId={receiptId} />
  );
}

function ReceiptReviewStatusGate({ receiptId }: { receiptId: string }) {
  const { data: receipt, isFetching } = useGetReceiptReview(receiptId);

  if (!receipt && isFetching) {
    return <ReceiptReviewLoadingView isFetching={isFetching} />;
  }

  if (!receipt || receiptNotFound(receipt)) {
    throw notFound();
  }

  if (!isProcessing(receipt) && !isFailed(receipt)) {
    return (
      <ReceiptEditorView key={receipt.receiptId} initialReceipt={receipt} />
    );
  }

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
