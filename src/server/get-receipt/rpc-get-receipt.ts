import { createServerFn } from '@tanstack/react-start'
import { getReceiptIsValid, getReceiptWithItems } from './get-receipt-service'
import { protectedFunctionMiddleware } from '../auth/protected-function'
import { receiptIdSchema } from '../dtos'
import { nameTransaction } from '../observability/sentry-middleware'

export const getReceiptRpc = createServerFn({ method: 'GET' })
    .middleware([nameTransaction('getReceipt')])
    .middleware([protectedFunctionMiddleware])
    .inputValidator(receiptIdSchema)
    .handler(async ({ data: receiptId, context }) => {
        return getReceiptWithItems(context.db, receiptId, context.user.id)
    })

export const getReceiptIsValidRpc = createServerFn({ method: 'GET' })
    .middleware([nameTransaction('getReceiptIsValidRpc')])
    .middleware([protectedFunctionMiddleware])
    .inputValidator(receiptIdSchema)
    .handler(async ({ data: receiptId, context }) => {
        return getReceiptIsValid(context.db, receiptId, context.user.id)
    })
