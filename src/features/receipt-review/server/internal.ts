/**
 * INTERNAL SERVER API - Receipt Review Feature
 *
 * These functions are for server-to-server calls ONLY.
 * Client code should use RPCs from rpc-get-receipt.ts or rpc-put-receipt.ts.
 *
 * Consumers:
 * - features/room (getReceiptIsValid)
 */

export { getReceiptIsValid } from './get-receipt-service'
