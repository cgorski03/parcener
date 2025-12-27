import { createServerFn } from '@tanstack/react-start'
import {
    createReceiptItem,
    deleteReceiptItem,
    editReceiptItem,
    finalizeReceiptTotals,
} from './edit-receipt-service'
import { createReceiptItemRequestSchema, receiptItemDtoSchema, receiptTotalsSchema } from '../dtos'
import { protectedFunctionMiddleware } from '../auth/protected-function'
import { nameTransaction } from '../observability/sentry-middleware'
import { logger } from '@/lib/logger'
import { SENTRY_EVENTS } from '@/lib/sentry-events'

export const editReceiptItemRpc = createServerFn({ method: 'POST' })
    .middleware([nameTransaction('editReceiptItemRpc'), protectedFunctionMiddleware])
    .inputValidator(receiptItemDtoSchema)
    .handler(async ({ data: item, context }) => {
        try {
            return await editReceiptItem(context.db, item, context.user.id)
        } catch (error) {
            logger.error(error, SENTRY_EVENTS.RECEIPT_EDIT.UPDATE_ITEM, {
                itemId: item.receiptItemId,
                userId: context.user.id
            });
            throw error;
        }
    })

export const deleteReceiptItemRpc = createServerFn({ method: 'POST' })
    .middleware([nameTransaction('deleteReceiptItemRpc'), protectedFunctionMiddleware])
    .inputValidator(receiptItemDtoSchema)
    .handler(async ({ data: item, context }) => {
        try {
            return await deleteReceiptItem(context.db, item, context.user.id);
        } catch (error) {
            logger.error(error, SENTRY_EVENTS.RECEIPT_EDIT.DELETE_ITEM, {
                itemId: item.receiptItemId,
                userId: context.user.id
            });
            throw error;
        }
    })

export const createReceiptItemRpc = createServerFn({ method: 'POST' })
    .middleware([nameTransaction('createReceiptItemRpc'), protectedFunctionMiddleware])
    .inputValidator(createReceiptItemRequestSchema)
    .handler(async ({ data, context }) => {
        try {
            const { receiptItem, receiptId } = data
            return await createReceiptItem(context.db, receiptItem, receiptId, context.user.id);
        } catch (error) {
            logger.error(error, SENTRY_EVENTS.RECEIPT_EDIT.CREATE_ITEM, {
                receiptId: data.receiptId,
                userId: context.user.id
            });
            throw error;
        }
    })

export const finalizeReceiptTotalsRpc = createServerFn({ method: 'POST' })
    .middleware([nameTransaction('finalizeReceiptTotalsRpc'), protectedFunctionMiddleware])
    .inputValidator(receiptTotalsSchema)
    .handler(async ({ data: totals, context }) => {
        try {
            return await finalizeReceiptTotals(context.db, totals, context.user.id)
        } catch (error) {
            logger.error(error, SENTRY_EVENTS.RECEIPT_EDIT.FINALIZE, {
                receiptId: totals.receiptId,
                userId: context.user.id
            });
            throw error;
        }
    })
