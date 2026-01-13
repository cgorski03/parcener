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
  if (!isProcessing(receipt) && !isFailed(receipt)) {
    return (
      <ReceiptEditorView key={receipt.receiptId} initialReceipt={receipt} />
    );
  }

  // 2. Status Views: Handle Processing and Error states in a shared layout
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

export function ReceiptReviewLoading({ isFetching }: { isFetching: boolean }) {
  return (
    <>
      <AppHeader />
      <ProcessingReceiptView isPolling={isFetching} />
    </>
  );
}
