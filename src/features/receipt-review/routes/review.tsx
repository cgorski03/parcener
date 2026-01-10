import { ReceiptEditorView } from '../components/editor-view';
import { ErrorReceiptView } from '../components/error-view';
import { ProcessingReceiptView } from '../components/processing-view';
import { isFailed, isProcessing } from '../lib/receipt-utils';
import type { ReceiptWithRoom } from '../server/get-receipt-service';
import type {
  ReceiptProcessingFailedResponse,
  ReceiptProcessingResponse,
} from '../server/responses';
import { AppHeader } from '@/shared/components/layout/app-header';

type ReceiptResponse =
  | ReceiptProcessingResponse
  | ReceiptProcessingFailedResponse
  | ReceiptWithRoom;

type ReceiptReviewPageProps = {
  receipt: ReceiptResponse;
  isFetching: boolean;
};

export function ReceiptReviewPage({
  receipt,
  isFetching,
}: ReceiptReviewPageProps) {
  if (isProcessing(receipt)) {
    return (
      <>
        <AppHeader />
        <ProcessingReceiptView isPolling={isFetching} />
      </>
    );
  }

  if (isFailed(receipt)) {
    return (
      <>
        <AppHeader />
        <ErrorReceiptView attempts={receipt.attempts} />
      </>
    );
  }

  return <ReceiptEditorView key={receipt.receiptId} initialReceipt={receipt} />;
}

export function ReceiptReviewLoading({ isFetching }: { isFetching: boolean }) {
  return (
    <>
      <AppHeader />
      <ProcessingReceiptView isPolling={isFetching} />
    </>
  );
}
