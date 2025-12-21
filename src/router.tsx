import { createRouter } from '@tanstack/react-router'
import * as Sentry from "@sentry/tanstackstart-react";
import { routeTree } from './routeTree.gen'

export const getRouter = () => {
    const router = createRouter({
        routeTree,
        scrollRestoration: true,
        defaultPreloadStaleTime: 0,
        notFoundMode: 'fuzzy',
    });


    if (!router.isServer) {
        Sentry.init({
            dsn: import.meta.env.VITE_SENTRY_DSN,
            integrations: [
                Sentry.tanstackRouterBrowserTracingIntegration(router),
            ],
            tracesSampleRate: 1.0,
            environment: import.meta.env.VITE_NODE_ENV,
        });
    }

    return router;
}
