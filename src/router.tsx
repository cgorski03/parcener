import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { routeTree } from './routeTree.gen';
import { queryClient as browserQueryClient } from '@/shared/lib/query-client';
import { QueryClient } from '@tanstack/react-query';

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

  // Handle Sentry Tracing
  if (!router.isServer) {
    import('@/shared/observability/sentry-client')
      .then((m) => {
        m.initSentry(router);
      })
      .catch((err) => console.error('Sentry failed to load', err));
  }

  return router;
};
