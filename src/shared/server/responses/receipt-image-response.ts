import type { ReceiptImageAccessResult } from '@/features/receipt-review/server/internal-types';

export function receiptImageAccessToResponse(access: ReceiptImageAccessResult) {
  if (access.type !== 'ok') {
    const status = access.type === 'forbidden' ? 403 : 404;
    return new Response(
      access.type === 'forbidden' ? 'Forbidden' : 'Not found',
      { status },
    );
  }

  const headers = new Headers();
  access.image.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'private, max-age=60');

  return new Response(access.image.body, {
    status: 200,
    headers,
  });
}
