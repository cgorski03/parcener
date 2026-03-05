import { createFileRoute } from '@tanstack/react-router';
import { getRoomReceiptImageAccess } from '@/features/room/server/room-receipt-image-service';
import { receiptImageAccessToResponse } from '@/shared/server/responses/receipt-image-response';

export const Route = createFileRoute('/api/receipt-image/room/$roomId')({
  server: {
    handlers: {
      GET: async ({ request, params, context }) => {
        const access = await getRoomReceiptImageAccess({
          request,
          roomId: params.roomId,
          db: context.db,
          env: context.cloudflare.env,
          auth: context.auth,
        });

        return receiptImageAccessToResponse(access);
      },
    },
  },
});
