import { createServerFn } from '@tanstack/react-start'
import { getReceiptIsValid, getReceiptWithItems } from './get-receipt-service'
import { nameTransaction } from '@/shared/observability/server/sentry-middleware'
import { protectedFunctionMiddleware } from '@/shared/auth/server/middleware'
import { receiptIdSchema } from '@/shared/dto/dtos'
import { logger } from '@/shared/observability/logger'
import { SENTRY_EVENTS } from '@/shared/observability/sentry-events'

export const getReceiptRpc = createServerFn({ method: 'GET' })
    .middleware([nameTransaction('getReceipt'), protectedFunctionMiddleware])
    .inputValidator(receiptIdSchema)
    .handler(async ({ data: receiptId, context }) => {
        try {
            return await getReceiptWithItems(context.db, receiptId, context.user.id)
        } catch (error) {
            logger.error(error, SENTRY_EVENTS.RECEIPT.GET_DETAILS, {
                receiptId,
                userId: context.user.id
            });
            throw error;
        }
    })

export const getReceiptIsValidRpc = createServerFn({ method: 'GET' })
    .middleware([nameTransaction('getReceiptIsValidRpc'), protectedFunctionMiddleware])
    .inputValidator(receiptIdSchema)
    .handler(async ({ data: receiptId, context }) => {
        try {
            return await getReceiptIsValid(context.db, receiptId, context.user.id)
        } catch (error) {
            logger.error(error, SENTRY_EVENTS.RECEIPT.CHECK_VALIDITY, {
                receiptId,
                userId: context.user.id
            });
            throw error;
        }
    })


