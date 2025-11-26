import { createServerFn } from '@tanstack/react-start'
import { getReceiptIsValid, getReceiptWithItems } from './get-receipt-service'
import z from 'zod'
import { getRequest } from '@tanstack/react-start/server'
import { getServerSession } from '../auth/get-server-session'
import { redirect } from '@tanstack/react-router'

export const getReceiptRpc = createServerFn({ method: 'GET' })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: receiptId, context }) => {
    const request = getRequest()
    const session = await getServerSession(request, context.auth)
    if (!session?.user) {
      throw redirect({ to: '/login' })
    }
    return getReceiptWithItems(context.db, receiptId, session.user.id)
  })

export const getReceiptIsValidRpc = createServerFn({ method: 'GET' })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: receiptId, context }) => {
    const request = getRequest()
    const session = await getServerSession(request, context.auth)
    if (!session?.user) {
      throw redirect({ to: '/login' })
    }
    return getReceiptIsValid(context.db, receiptId, session.user.id)
  })
