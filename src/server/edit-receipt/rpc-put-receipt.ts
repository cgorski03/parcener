import { createServerFn } from '@tanstack/react-start'
import {
  createReceiptItem,
  deleteReceiptItem,
  editReceiptItem,
  finalizeReceiptTotals,
} from './edit-receipt-service'
import { ReceiptItemDto, ReceiptTotalsDto } from '../dtos'

export const editReceiptItemRpc = createServerFn({ method: 'POST' })
  .inputValidator((receiptItem: ReceiptItemDto) => receiptItem)
  .handler(async ({ data: receipt, context }) => {
    return editReceiptItem(context.db, receipt)
  })

export const deleteReceiptItemRpc = createServerFn({ method: 'POST' })
  .inputValidator((receiptItem: ReceiptItemDto) => receiptItem)
  .handler(async ({ data: receipt, context }) => {
    return deleteReceiptItem(context.db, receipt)
  })

export const createReceiptItemRpc = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: { receiptItem: ReceiptItemDto; receiptId: string }) => input,
  )
  .handler(async ({ data, context }) => {
    const { receiptItem, receiptId } = data
    return createReceiptItem(context.db, receiptItem, receiptId)
  })

export const finalizeReceiptTotalsRpc = createServerFn({ method: 'POST' })
  .inputValidator((receipt: ReceiptTotalsDto) => receipt)
  .handler(async ({ data: receipt, context }) => {
    return finalizeReceiptTotals(context.db, receipt)
  })
