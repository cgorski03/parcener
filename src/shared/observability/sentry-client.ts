import {
  init,
  tanstackRouterBrowserTracingIntegration,
} from '@sentry/tanstackstart-react';
import type { AnyRouter } from '@tanstack/react-router';

export function initSentry(router: AnyRouter) {
  init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [tanstackRouterBrowserTracingIntegration(router)],
    tracesSampleRate: 1.0,
    environment: import.meta.env.VITE_NODE_ENV,
  });
}
