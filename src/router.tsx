import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { QueryClient } from '@tanstack/react-query';
import { routeTree } from './routeTree.gen';
import { queryClient as browserQueryClient } from '@/shared/lib/query-client';

export const getRouter = () => {
  const queryClient =
    typeof window === 'undefined' ? new QueryClient() : browserQueryClient;

  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    notFoundMode: 'fuzzy',
    context: {
      queryClient: queryClient,
    },
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  // Client-side initialization
  if (!router.isServer) {
    // Handle Sentry Tracing
    import('@/shared/observability/sentry-client')
      .then((m) => {
        m.initSentry(router);
      })
      .catch((err) => console.error('Sentry failed to load', err));

    // Handle stale chunk reloads after deploys
    import('@/shared/lib/chunk-reload-handler')
      .then((m) => {
        m.initChunkReloadHandler();
      })
      .catch((err) => console.error('Chunk reload handler failed to load', err));
  }

  return router;
};
