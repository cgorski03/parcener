import * as Sentry from "@sentry/tanstackstart-react";

export const logger = {
    error: (error: unknown, name: string, extra?: Record<string, any>) => {
        console.error(`[${name}]`, error);

        Sentry.withScope((scope) => {
            scope.setTag("event_name", name);

            if (extra) {
                scope.setContext("details", extra);
            }

            Sentry.captureException(error);
        });
    },

    info: (message: string, name: string, data?: Record<string, any>) => {
        console.log(`[${name}] ${message}`);

        Sentry.addBreadcrumb({
            category: "app.info",
            message: `${name}: ${message}`,
            data,
            level: "info",
        });
    }
};
