import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import { processingQueueHandler } from './processing/processing-service'
import { ReceiptJob } from './processing/types'
import { DbType, getDb } from './db'
import { createAuth } from './auth'
import { Auth } from 'better-auth'

// 1. Augment the context type so TS knows about Cloudflare
declare module '@tanstack/react-start' {
  interface Register {
    server: {
      requestContext: {
        cloudflare: {
          env: Cloudflare.Env
          ctx: ExecutionContext
        }
        db: DbType
        auth: Auth
      }
    }
  }
}

// 2. Create the standard handler exactly like the node_modules code does
// The docs i tried to follow are here https://tanstack.com/start/latest/docs/framework/react/guide/server-entry-point
// These did not work. The import was not correct i don't know if it was a version thing
// I copied from the node_modules
const baseFetch = createStartHandler(defaultStreamHandler)

// 3. Export the Cloudflare Worker object
export default {
  // Base HTTP Handler (Website)
  async fetch(request: Request, env: any, ctx: any) {
    // We call the base handler, but we pass the 2nd argument (RequestOptions)
    // to inject the Cloudflare environment into the context
    const db = getDb(env)
    const auth = createAuth(db)
    return baseFetch(request, {
      context: {
        cloudflare: { env, ctx },
        db,
        auth,
      },
    })
  },

  // Queue Handler
  // Not implemented yet, but this will be the queue endpoint
  // The queue will handle the processing of receipts
  async queue(
    batch: MessageBatch<ReceiptJob>,
    env: Env,
    ctx: ExecutionContext,
  ) {
    const db = getDb(env)
    await processingQueueHandler(db, batch, env, ctx)
  },
}
