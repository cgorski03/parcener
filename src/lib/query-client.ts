import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { logger } from "./logger";
import { SENTRY_EVENTS } from "./sentry-events";

export const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error, query) => {
            // Automatically logs any background fetch failure
            logger.error(error, SENTRY_EVENTS.QUERY.FAILURE, {
                queryKey: query.queryKey,
            });
        },
    }),
    mutationCache: new MutationCache({
        onError: (error, _variables, _context, mutation) => {
            // Automatically logs any action (create, join, delete) failure
            logger.error(error, SENTRY_EVENTS.MUTATION.FAILURE, {
                mutationKey: mutation.options.mutationKey
            });
        },
    }),
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,
        },
    },
})

