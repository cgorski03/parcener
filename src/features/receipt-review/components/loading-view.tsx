import { ProcessingReceiptView } from './processing-view';
import { AppHeader } from '@/shared/components/layout/app-header';

export default function ReceiptReviewLoadingView({
  isFetching,
}: {
  isFetching: boolean;
}) {
  return (
    <>
      <AppHeader />
      <ProcessingReceiptView isPolling={isFetching} />
    </>
  );
}
