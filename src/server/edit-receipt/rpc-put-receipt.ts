import { createServerFn } from '@tanstack/react-start'
import {
    createReceiptItem,
    deleteReceiptItem,
    editReceiptItem,
    finalizeReceiptTotals,
} from './edit-receipt-service'
import { receiptItemDtoSchema, receiptItemWithReceiptIdSchema, receiptTotalsSchema } from '../dtos'
import { protectedFunctionMiddleware } from '../auth/protected-function'

export const editReceiptItemRpc = createServerFn({ method: 'POST' })
    .middleware([protectedFunctionMiddleware])
    .inputValidator(receiptItemDtoSchema)
    .handler(async ({ data: receipt, context }) => {
        return editReceiptItem(context.db, receipt, context.user.id)
    })

export const deleteReceiptItemRpc = createServerFn({ method: 'POST' })
    .middleware([protectedFunctionMiddleware])
    .inputValidator(receiptItemDtoSchema)
    .handler(async ({ data: receipt, context }) => {
        return deleteReceiptItem(context.db, receipt, context.user.id);
    })

export const createReceiptItemRpc = createServerFn({ method: 'POST' })
    .middleware([protectedFunctionMiddleware])
    .inputValidator(receiptItemWithReceiptIdSchema)
    .handler(async ({ data, context }) => {
        const { receiptItem, receiptId } = data
        return createReceiptItem(context.db, receiptItem, receiptId, context.user.id);
    })

export const finalizeReceiptTotalsRpc = createServerFn({ method: 'POST' })
    .middleware([protectedFunctionMiddleware])
    .inputValidator(receiptTotalsSchema)
    .handler(async ({ data: receipt, context }) => {
        return finalizeReceiptTotals(context.db, receipt, context.user.id)
    })
