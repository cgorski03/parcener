import { createServerFn } from '@tanstack/react-start'
import { createReceiptStub } from './processing-service'
import { env } from 'cloudflare:workers'
import { ReceiptJob } from './types'
import { protectedFunctionMiddleware } from '../auth/protected-function'

export const uploadReceipt = createServerFn({ method: 'POST' })
    .middleware([protectedFunctionMiddleware])
    .inputValidator((data: FormData) => data)
    .handler(async ({ data, context }) => {
        // Authenticate and Authorie req
        const file = data.get('file') as File
        const buffer = await file.arrayBuffer()

        if (!file) throw new Error('No file provided')

        const receiptId = crypto.randomUUID()
        // Save the receipt image to R3
        await env.parcener_receipt_images.put(receiptId, buffer)
        await createReceiptStub(context.db, receiptId, context.user.id)
        const job: ReceiptJob = {
            receiptId,
        }
        await env.RECEIPT_QUEUE.send(job)
        console.log('processed successfully', receiptId)
        return { receiptId, created: true }
    })
