import { processReceipt } from '../processing-service';
import type { ReceiptJob } from '../types';
import type { DbType } from '@/shared/server/db';

export async function processingQueueMessageHandler(request: {
  db: DbType;
  message: Message<ReceiptJob>;
  env: Env;
  ctx: ExecutionContext;
}) {
  const { db, message, env } = request;
  const { receiptId, thinkingLevel } = message.body;
  await processReceipt({
    db,
    receiptId,
    imageSource: env.parcener_receipt_images,
    thinkingLevel,
  });
  message.ack();
}
