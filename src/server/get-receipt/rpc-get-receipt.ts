import { createServerFn } from '@tanstack/react-start'
import { getReceiptIsValid, getReceiptWithItems } from './get-receipt-service'
import { protectedFunctionMiddleware } from '../auth/protected-function'
import { receiptIdSchema } from '../dtos'
import { nameTransaction } from '../observability/sentry-middleware'
import { logger } from '@/lib/logger'
import { SENTRY_EVENTS } from '@/lib/sentry-events'

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


