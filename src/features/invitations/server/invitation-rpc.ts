import { createServerFn } from '@tanstack/react-start';
import {
  InviteError,
  acceptInvitationToUpload,
  createUploadInvitation,
  getUserInviteRateLimit,
} from './invitation-service';
import { inviteIdSearchParamsSchema } from './dtos';
import {
  canUploadMiddleware,
  protectedFunctionMiddleware,
} from '@/shared/auth/server/middleware';
import { nameTransaction } from '@/shared/observability/server/sentry-middleware';
import { logger } from '@/shared/observability/logger';
import { SENTRY_EVENTS } from '@/shared/observability/sentry-events';
import { RateLimitError } from '@/shared/server/responses/errors';
import { throwRpcError } from '@/shared/server/utils/rpc-errors';

export const getUserInviteRateLimitRpc = createServerFn({ method: 'GET' })
  .middleware([
    nameTransaction('getUserInviteRateLimit'),
    protectedFunctionMiddleware,
  ])
  .handler(async ({ context }) => {
    try {
      return await getUserInviteRateLimit(context.db, context.user);
    } catch (error) {
      logger.error(error, SENTRY_EVENTS.ACCOUNT.CHECK_INVITE_LIMITS);
      throwRpcError('Failed to load invite limits');
    }
  });

export const createInviteRpc = createServerFn({ method: 'POST' })
  .middleware([nameTransaction('createInviteRpc'), canUploadMiddleware])
  .handler(async ({ context }) => {
    try {
      return await createUploadInvitation(context.db, context.user);
    } catch (error) {
      if (error instanceof RateLimitError) {
        logger.info(
          'Invite creation blocked by limit',
          SENTRY_EVENTS.ACCOUNT.INVITE_LIMIT,
          {
            userId: context.user.id,
          },
        );
        throwRpcError(error.message);
      }
      logger.error(error, SENTRY_EVENTS.ACCOUNT.CREATE_INVITATION, {
        userId: context.user.id,
      });
      throwRpcError('Failed to create invitation');
    }
  });

export const acceptInviteRpc = createServerFn({ method: 'POST' })
  .middleware([nameTransaction('acceptInviteRpc'), protectedFunctionMiddleware])
  .inputValidator(inviteIdSearchParamsSchema)
  .handler(async ({ data, context }) => {
    try {
      return await acceptInvitationToUpload(
        context.db,
        context.user.id,
        data.token,
      );
    } catch (error) {
      // 1. User Input Error (Code used / Invalid)
      if (error instanceof InviteError) {
        logger.info(
          'Invite acceptance failed',
          SENTRY_EVENTS.ACCOUNT.ACCEPT_INVITATION,
          {
            reason: error.code,
            inviteId: data.token,
          },
        );
        throwRpcError(error.message);
      }

      // 2. System Error
      logger.error(error, SENTRY_EVENTS.ACCOUNT.ACCEPT_INVITATION, {
        inviteId: data.token,
      });
      throwRpcError('Failed to accept invitation');
    }
  });
