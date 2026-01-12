import { createMiddleware } from '@tanstack/react-start';
import * as Sentry from '@sentry/cloudflare';

export const nameTransaction = (name: string) => {
  return createMiddleware().server(async ({ next }) => {
    Sentry.setTag('rpc_method', name);
    const transaction = Sentry.getActiveSpan();
    if (transaction) {
      transaction.updateName(`RPC: ${name}`);
      Sentry.getCurrentScope().setTransactionName(`RPC: ${name}`);
    }

    return next();
  });
};
