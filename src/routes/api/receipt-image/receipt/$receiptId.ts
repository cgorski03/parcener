import { createFileRoute } from '@tanstack/react-router';
import { getOwnedReceiptImageAccess } from '@/features/receipt-review/server/receipt-image-access-service';
import { receiptImageAccessToResponse } from '@/shared/server/responses/receipt-image-response';

export const Route = createFileRoute('/api/receipt-image/receipt/$receiptId')({
  server: {
    handlers: {
      GET: async ({ request, params, context }) => {
        const access = await getOwnedReceiptImageAccess({
          request,
          receiptId: params.receiptId,
          db: context.db,
          env: context.cloudflare.env,
          auth: context.auth,
        });

        return receiptImageAccessToResponse(access);
      },
    },
  },
});
