import {
  withScope,
  captureException,
  addBreadcrumb,
} from '@sentry/tanstackstart-react';

export const logger = {
  error: (error: unknown, name: string, extra?: Record<string, any>) => {
    console.error(`[${name}]`, error);

    withScope((scope) => {
      scope.setTag('event_name', name);

      if (extra) {
        scope.setContext('details', extra);
      }

      captureException(error);
    });
  },

  info: (message: string, name: string, data?: Record<string, any>) => {
    console.log(`[${name}] ${message}`);

    addBreadcrumb({
      category: 'app.info',
      message: `${name}: ${message}`,
      data,
      level: 'info',
    });
  },
};
