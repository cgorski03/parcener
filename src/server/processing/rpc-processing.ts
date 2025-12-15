import { createServerFn } from '@tanstack/react-start'
import { createReceiptStub } from './processing-service'
import { env } from 'cloudflare:workers'
import { ReceiptJob } from './types'
import { protectedFunctionMiddleware } from '../auth/protected-function'

export const uploadReceipt = createServerFn({ method: 'POST' })
    .middleware([protectedFunctionMiddleware])
    .inputValidator((data: FormData) => data)
    .handler(async ({ data, context }) => {
        const file = data.get('file') as File
        const MAX_FILE_SIZE = 5 * 1024 * 1024

        if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File size exceeds maximum allowed size of 5MB`)
        }

        if (!file) throw new Error('No file provided')

        const receiptId = crypto.randomUUID()
        // Save the receipt image to R3

        await env.parcener_receipt_images.put(receiptId, file.stream(), {
            httpMetadata: { contentType: file.type }
        })

        await createReceiptStub(context.db, receiptId, context.user.id)
        const job: ReceiptJob = {
            receiptId,
        }
        await env.RECEIPT_QUEUE.send(job)
        return { receiptId, created: true }
    })
