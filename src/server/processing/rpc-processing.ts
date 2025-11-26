import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createReceiptStub } from './processing-service'
import { env } from 'cloudflare:workers'
import { ReceiptJob } from './types'
import { getServerSession } from '../auth/get-server-session'

export const uploadReceipt = createServerFn({ method: 'POST' })
  .inputValidator((data: FormData) => data)
  .handler(async ({ data, context }) => {
    // Authenticate and Authorie req
    const request = getRequest()
    const session = await getServerSession(request, context.auth)
    if (session?.user.id == null) {
      throw new Error('Not authorized to perform this action')
    }

    const file = data.get('file') as File
    const buffer = await file.arrayBuffer()

    if (!file) throw new Error('No file provided')

    const receiptId = crypto.randomUUID()
    // Save the receipt image to R3
    await env.parcener_receipt_images.put(receiptId, buffer)
    await createReceiptStub(context.db, receiptId, session.user.id)
    const job: ReceiptJob = {
      receiptId,
    }
    await env.RECEIPT_QUEUE.send(job)
    console.log('processed successfully', receiptId)
    return { receiptId, created: true }
  })
