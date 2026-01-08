import { protectedFunctionMiddleware } from '@/shared/auth/server/middleware';
import { nameTransaction } from '@/shared/observability/server/sentry-middleware';
import { createServerFn } from '@tanstack/react-start';
import { getRecentReceipts, getRecentRooms } from './recent-activity-service';
import { logger } from '@/shared/observability/logger';
import { SENTRY_EVENTS } from '@/shared/observability/sentry-events';

export const getUserRecentReceiptsRpc = createServerFn({ method: 'GET' })
  .middleware([
    nameTransaction('getUserRecentReceipts'),
    protectedFunctionMiddleware,
  ])
  .handler(async ({ context }) => {
    try {
      return await getRecentReceipts(context.db, context.user);
    } catch (error) {
      logger.error(error, SENTRY_EVENTS.ACCOUNT.GET_RECENT_RECEIPTS);
      throw error;
    }
  });

export const getUserRecentRoomsRpc = createServerFn({ method: 'GET' })
  .middleware([
    nameTransaction('getUserRecentRooms'),
    protectedFunctionMiddleware,
  ])
  .handler(async ({ context }) => {
    try {
      return await getRecentRooms(context.db, context.user);
    } catch (error) {
      logger.error(error, SENTRY_EVENTS.ACCOUNT.GET_RECENT_RECEIPTS);
      throw error;
    }
  });
