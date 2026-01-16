import * as Sentry from '@sentry/cloudflare';
import type { DbType } from '@/shared/server/db';
import type { GoogleThinkingLevel, ReceiptJob } from '../types';
import { receipt } from '@/shared/server/db';

type EnqueueReceiptRequest = {
  db: DbType;
  env: Env;
  file: File;
  userId: string;
  thinkingLevel: GoogleThinkingLevel;
};

export async function processUploadAndEnqueue(request: EnqueueReceiptRequest) {
  const { db, env, file, userId, thinkingLevel } = request;
  const receiptId = crypto.randomUUID();

  await env.parcener_receipt_images.put(receiptId, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  await db.insert(receipt).values({
    id: receiptId,
    userId,
  });

  const activeSpan = Sentry.getActiveSpan();

  if (activeSpan) {
    activeSpan.setAttribute('receiptId', receiptId);
    activeSpan.setAttribute('fileSize', file.size);
  }

  const traceHeader = activeSpan
    ? Sentry.spanToTraceHeader(activeSpan)
    : undefined;
  const baggageHeader = activeSpan
    ? Sentry.spanToBaggageHeader(activeSpan)
    : undefined;

  const job: ReceiptJob = {
    receiptId,
    __sentry_baggage: baggageHeader,
    __sentry_trace: traceHeader,
    thinkingLevel,
  };

  await env.RECEIPT_QUEUE.send(job);

  return { receiptId };
}
