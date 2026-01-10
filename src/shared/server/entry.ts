import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server';
import * as Sentry from '@sentry/cloudflare';
import { createAuth } from '../auth/server';
import { getDb } from './db';
import type { DbType} from './db';
import type { ApplicationAuthClient} from '../auth/server';
import type { ReceiptJob } from '@/features/upload-receipt/server/types';
import { processingQueueMessageHandler } from '@/features/upload-receipt/server/processing-service';

// 1. Augment the context type so TS knows about Cloudflare
declare module '@tanstack/react-start' {
  interface Register {
    server: {
      requestContext: {
        cloudflare: {
          env: Cloudflare.Env;
          ctx: ExecutionContext;
        };
        db: DbType;
        auth: ApplicationAuthClient;
      };
    };
  }
}

// 2. Create the standard handler exactly like the node_modules code does
// The docs i tried to follow are here https://tanstack.com/start/latest/docs/framework/react/guide/server-entry-point
// These did not work. The import was not correct i don't know if it was a version thing
// I copied from the node_modules
const baseFetch = createStartHandler(defaultStreamHandler);

// 3. Export the Cloudflare Worker object
const handler = {
  async fetch(request: Request, env: any, ctx: any) {
    // We call the base handler, but we pass the 2nd argument (RequestOptions)
    // to inject the Cloudflare environment into the context
    const db = getDb(env);
    const auth = createAuth(db, env);
    return baseFetch(request, {
      context: {
        cloudflare: { env, ctx },
        db,
        auth,
      },
    });
  },

  async queue(batch: MessageBatch<any>, env: Env, ctx: ExecutionContext) {
    // We set up the tracing like this in order to pass the trace from the RPC to the queue handler in the distributed system, and have a better outline of the whole flow of a request
    const db = getDb(env);
    for (const message of batch.messages) {
      const body = message.body as ReceiptJob;
      console.log('Picked up from Queue', {
        receiptId: body.receiptId,
        parentTraceId: body.__sentry_trace,
      });
      await Sentry.continueTrace(
        {
          sentryTrace: body.__sentry_trace,
          baggage: body.__sentry_baggage,
        },
        async () => {
          await Sentry.startSpan(
            {
              name: 'queue.process_receipt',
              op: 'queue.process',
              attributes: {
                receiptId: body.receiptId,
              },
            },
            async () => {
              try {
                await processingQueueMessageHandler(db, message, env, ctx);
              } catch (error) {
                Sentry.captureException(error, {
                  tags: { source: 'queue_processor' },
                  extra: { receiptId: body.receiptId },
                });
                message.retry();
              }
            },
          );
        },
      );
    }
  },
};

export default Sentry.withSentry(
  // Configuration Callback: This gets access to 'env' so we can read the DSN dynamically
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  }),
  handler,
);
