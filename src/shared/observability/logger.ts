import type * as SentryTypes from '@sentry/tanstackstart-react';

type SentryModule = typeof SentryTypes;

let sentryModule: SentryModule | null = null;
let sentryLoadPromise: Promise<SentryModule> | null = null;

async function getSentry(): Promise<SentryModule> {
  if (sentryModule) return sentryModule;

  if (!sentryLoadPromise) {
    sentryLoadPromise = import('@sentry/tanstackstart-react').then((m) => {
      sentryModule = m;
      return m;
    });
  }

  return sentryLoadPromise;
}

export const logger = {
  error: (error: unknown, name: string, extra?: Record<string, any>) => {
    console.error(`[${name}]`, error);

    getSentry().then(({ withScope, captureException }) => {
      withScope((scope) => {
        scope.setTag('event_name', name);

        if (extra) {
          scope.setContext('details', extra);
        }

        captureException(error);
      });
    });
  },

  info: (message: string, name: string, data?: Record<string, any>) => {
    console.log(`[${name}] ${message}`);

    getSentry().then(({ addBreadcrumb }) => {
      addBreadcrumb({
        category: 'app.info',
        message: `${name}: ${message}`,
        data,
        level: 'info',
      });
    });
  },
};
