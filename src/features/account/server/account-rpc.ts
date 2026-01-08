import { getServerSession } from '@/shared/auth/server/get-server-session';
import { protectedFunctionMiddleware } from '@/shared/auth/server/middleware';
import { logger } from '@/shared/observability/logger';
import { SENTRY_EVENTS } from '@/shared/observability/sentry-events';
import { nameTransaction } from '@/shared/observability/server/sentry-middleware';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';

// WE DONT PUT MIDDLEWARe here we want to control the redirect when this is called
export const getUserRpc = createServerFn({ method: 'GET' })
  .middleware([nameTransaction('getUser')])
  .handler(async ({ context }) => {
    try {
      const request = getRequest();
      const session = await getServerSession(request, context.auth);
      return session?.user;
    } catch (error) {
      logger.error(error, SENTRY_EVENTS.AUTH.SESSION_CHECK);
      throw error;
    }
  });

export const getUserWithRedirect = createServerFn({ method: 'GET' })
  .middleware([
    nameTransaction('getUserWithRedirect'),
    protectedFunctionMiddleware,
  ])
  .handler(async ({ context }) => {
    try {
      return context.user;
    } catch (error) {
      logger.error(error, SENTRY_EVENTS.AUTH.SESSION_CHECK);
      throw error;
    }
  });
