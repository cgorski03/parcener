import { createServerFn } from '@tanstack/react-start';
import { createReceiptStub } from './processing-service';
import { env } from 'cloudflare:workers';
import { ReceiptJob } from './types';
import { canUploadMiddleware } from '../auth/protected-function';
import * as Sentry from '@sentry/cloudflare';
import { nameTransaction } from '../observability/sentry-middleware';

export const uploadReceipt = createServerFn({ method: 'POST' })
    .middleware([canUploadMiddleware, nameTransaction('uploadReceipt')])
    .inputValidator((data: FormData) => data)
    .handler(async ({ data, context }) => {
        const file = data.get('file') as File;
        const MAX_FILE_SIZE = 5 * 1024 * 1024;

        if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File size exceeds maximum allowed size of 5MB`);
        }

        if (!file) throw new Error('No file provided');

        const receiptId = crypto.randomUUID();
        // Save the receipt image to R3

        await env.parcener_receipt_images.put(receiptId, file.stream(), {
            httpMetadata: { contentType: file.type }
        })

        await createReceiptStub(context.db, receiptId, context.user.id);

        //  Pass the trace information so we can capture the processing data with the original request
        const activeSpan = Sentry.getActiveSpan();
        // Tag the span with the receiptId
        if (activeSpan) {
            activeSpan.setAttribute("receiptId", receiptId);
        }
        const traceHeader = activeSpan ? Sentry.spanToTraceHeader(activeSpan) : undefined;
        const baggageHeader = activeSpan ? Sentry.spanToBaggageHeader(activeSpan) : undefined;

        const job: ReceiptJob = {
            receiptId,
            __sentry_baggage: baggageHeader,
            __sentry_trace: traceHeader,
        };
        console.log("Handoff to Queue", { receiptId, traceId: Sentry.getActiveSpan()?.spanContext().traceId })
        await env.RECEIPT_QUEUE.send(job);
        return { receiptId, created: true };
    })
