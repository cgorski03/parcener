import { createFileRoute, notFound } from '@tanstack/react-router';
import { useGetReceiptReview } from '@/features/receipt-review/hooks/use-get-receipt';
import { receiptNotFound } from '@/features/receipt-review/lib/receipt-utils';
import {
  ReceiptReviewLoading,
  ReceiptReviewPage,
} from '@/features/receipt-review/routes/review';
import { ReviewNotFound } from '@/shared/components/layout/not-found';
import { paymentMethodsOptions } from '@/features/payment-methods/hooks/use-payment-methods';

export const Route = createFileRoute('/_authed/receipt/review/$receiptId')({
  head: () => ({
    meta: [
      { title: 'Review Receipt | Parcener' },
      { property: 'og:title', content: `Review Receipt | Parcener` },
    ],
  }),
  loader: async ({ params, context }) => {
    // Preload payment methods in parallel with receipt data to prevent
    // race conditions on unstable mobile networks (fixes PARCENER-19)
    await context.queryClient.ensureQueryData(paymentMethodsOptions());
    return { receiptId: params.receiptId };
  },
  component: RouteComponent,
  notFoundComponent: ReviewNotFound,
});

function RouteComponent() {
  const { receiptId } = Route.useParams();
  const { data: receipt, isFetching } = useGetReceiptReview(receiptId);

  if (isFetching && !receipt) {
    return <ReceiptReviewLoading isFetching={isFetching} />;
  }

  if (!receipt || receiptNotFound(receipt)) {
    throw notFound();
  }

  return <ReceiptReviewPage receipt={receipt} isFetching={isFetching} />;
}
