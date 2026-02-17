import { createServerFn } from '@tanstack/react-start';
import { getRecentReceipts, getRecentRooms } from './recent-activity-service';
import { protectedFunctionMiddleware } from '@/shared/auth/server/middleware';
import { nameTransaction } from '@/shared/observability/server/sentry-middleware';
import { logger } from '@/shared/observability/logger';
import { SENTRY_EVENTS } from '@/shared/observability/sentry-events';
import { throwRpcError } from '@/shared/server/utils/rpc-errors';

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
      throwRpcError('Failed to load recent receipts');
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
      logger.error(error, SENTRY_EVENTS.ACCOUNT.GET_RECENT_ROOMS);
      throwRpcError('Failed to load recent rooms');
    }
  });
