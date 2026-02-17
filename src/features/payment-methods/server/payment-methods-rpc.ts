import { createServerFn } from '@tanstack/react-start';
import {
  createUserPaymentMethod,
  deleteUserPaymentMethod,
  getUserPaymentMethods,
} from './payment-method-service';
import { nameTransaction } from '@/shared/observability/server/sentry-middleware';
import { protectedFunctionMiddleware } from '@/shared/auth/server/middleware';
import { logger } from '@/shared/observability/logger';
import { SENTRY_EVENTS } from '@/shared/observability/sentry-events';
import {
  createPaymentMethodRequest,
  paymentMethodIdSchema,
} from '@/shared/dto/dtos';
import { throwRpcError } from '@/shared/server/utils/rpc-errors';

export const createPaymentMethod = createServerFn({ method: 'POST' })
  .middleware([
    nameTransaction('createPaymentMethod'),
    protectedFunctionMiddleware,
  ])
  .inputValidator(createPaymentMethodRequest)
  .handler(async ({ context, data: request }) => {
    try {
      return await createUserPaymentMethod(context.db, context.user, request);
    } catch (error) {
      logger.error(error, SENTRY_EVENTS.ACCOUNT.PAYMENT_METHOD.CREATE, {
        userId: context.user.id,
      });
      throwRpcError('Failed to create payment method');
    }
  });

export const getPaymentMethods = createServerFn({ method: 'GET' })
  .middleware([
    nameTransaction('getPaymentMethods'),
    protectedFunctionMiddleware,
  ])
  .handler(async ({ context }) => {
    try {
      return await getUserPaymentMethods(context.db, context.user);
    } catch (error) {
      logger.error(error, SENTRY_EVENTS.ACCOUNT.PAYMENT_METHOD.GET, {
        userId: context.user.id,
      });
      throwRpcError('Failed to load payment methods');
    }
  });

export const deletePaymentMethod = createServerFn({ method: 'POST' })
  .middleware([
    nameTransaction('deletePaymentMethod'),
    protectedFunctionMiddleware,
  ])
  .inputValidator(paymentMethodIdSchema)
  .handler(async ({ context, data: request }) => {
    try {
      await deleteUserPaymentMethod(
        context.db,
        context.user,
        request.paymentMethodId,
      );
    } catch (error) {
      logger.error(error, SENTRY_EVENTS.ACCOUNT.PAYMENT_METHOD.DELETE, {
        userId: context.user.id,
      });
      throwRpcError('Failed to delete payment method');
    }
  });
