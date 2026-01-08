import { describe, it, expect } from 'vitest'
import { testDb } from '@/test/setup'
import { createTestUser } from '@/test/factories/user'
import {
    createTestReceipt,
    createProcessingReceipt,
    createSuccessfulReceipt,
    createFailedReceipt,
} from '@/test/factories/receipt'
import { NOT_FOUND, RECEIPT_PROCESSING } from '@/shared/server/response-types'
import { getReceiptState, getReceiptWithItems, ReceiptState } from './get-receipt-service'
import { eq } from 'drizzle-orm'
import { validateReceiptCalculations } from '@/shared/lib/money-math'
import { GetReceiptResponse } from './responses'
import { receipt } from '@/shared/server/db'

function assertReceiptSuccess(
    result: GetReceiptResponse,
): asserts result is Extract<GetReceiptResponse, { receiptId: string }> {
    // Checks specifically for the success signature (having an 'id' but no 'error')
    if (!('receiptId' in result) || 'error' in result) {
        throw new Error(`Expected receipt success, got: ${JSON.stringify(result)}`)
    }
}
/**
 * Narrows ReceiptState to 'valid'
 */
function assertValid(
    state: ReceiptState,
): asserts state is Extract<ReceiptState, { status: 'valid' }> {
    if (state.status !== 'valid') {
        throw new Error(`Expected status 'valid', got '${state.status}'`)
    }
}

/**
 * Narrows ReceiptState to 'subtotal_mismatch'
 */
function assertSubtotalMismatch(
    state: ReceiptState,
): asserts state is Extract<ReceiptState, { status: 'subtotal_mismatch' }> {
    if (state.status !== 'subtotal_mismatch') {
        throw new Error(`Expected status 'subtotal_mismatch', got '${state.status}'`)
    }
}

/**
 * Narrows ReceiptState to 'grandtotal_mismatch'
 */
function assertGrandTotalMismatch(
    state: ReceiptState,
): asserts state is Extract<ReceiptState, { status: 'grandtotal_mismatch' }> {
    if (state.status !== 'grandtotal_mismatch') {
        throw new Error(`Expected status 'grandtotal_mismatch', got '${state.status}'`)
    }
}
describe('get-receipt-service', () => {
    describe('getReceiptWithItems', () => {
        it('returns NOT_FOUND for non-existent receipt', async () => {
            const result = await getReceiptWithItems(testDb, 'invalid-id', 'user-id')

            expect(result).toEqual(NOT_FOUND)
        })

        it('returns RECEIPT_PROCESSING for processing receipt', async () => {
            const user = await createTestUser()
            const { receipt: processingReceipt } = await createProcessingReceipt(
                user.id,
            )

            const result = await getReceiptWithItems(
                testDb,
                processingReceipt.id,
                user.id,
            )

            expect(result).toEqual(RECEIPT_PROCESSING)
        })

        it('returns RECEIPT_PROCESSING for receipt with no processing info', async () => {
            const user = await createTestUser()
            const { receipt: receiptWithNoProcessing } = await createTestReceipt(
                user.id,
            )

            const result = await getReceiptWithItems(
                testDb,
                receiptWithNoProcessing.id,
                user.id,
            )

            expect(result).toEqual(RECEIPT_PROCESSING)
        })

        it('returns failed receipt response', async () => {
            const user = await createTestUser()
            const { receipt: failedReceipt } = await createFailedReceipt(user.id)

            const result = await getReceiptWithItems(
                testDb,
                failedReceipt.id,
                user.id,
            )

            expect('attempts' in result).toBe(true)
            if ('attempts' in result) {
                expect(result.attempts).toBe(1)
            }
        })

        it('returns successful receipt with items', async () => {
            const user = await createTestUser()
            const { receipt } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10, quantity: 2 },
                { interpretedText: 'Item 2', price: 5, quantity: 1 },
            ])

            const result = await getReceiptWithItems(testDb, receipt.id, user.id)

            assertReceiptSuccess(result);

            expect(result.receiptId).toBe(receipt.id)
            expect(result.items).toHaveLength(2)
            expect(result.items[0].interpretedText).toBe('Item 1')
            expect(result.items[1].interpretedText).toBe('Item 2')
        })

        it('returns receipt with roomId when room exists', async () => {
            const user = await createTestUser()
            const { receipt } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10 },
            ])
            const { createTestRoom } = await import('@/test/factories/room')
            const room = await createTestRoom(receipt.id, user.id)

            const result = await getReceiptWithItems(testDb, receipt.id, user.id)
            assertReceiptSuccess(result);

            expect(result.roomId).toBe(room.id)
        })

        it('does not return other users receipts', async () => {
            const user1 = await createTestUser()
            const user2 = await createTestUser()
            const { receipt } = await createSuccessfulReceipt(user1.id, [
                { interpretedText: 'Item 1', price: 10 },
            ])

            const result = await getReceiptWithItems(testDb, receipt.id, user2.id)

            expect(result).toEqual(NOT_FOUND)
        })
    })

    describe('getReceiptState', () => {
        it('returns not_found for non-existent receipt', async () => {
            const result = await getReceiptState(testDb, 'invalid-id', 'user-id')

            expect(result.status).toEqual('not_found')
        })

        it('returns processing for processing receipt', async () => {
            const user = await createTestUser()
            const { receipt: processingReceipt } = await createProcessingReceipt(
                user.id,
            )

            const result = await getReceiptState(
                testDb,
                processingReceipt.id,
                user.id,
            )

            expect(result.status).toEqual('processing')
        })

        it('returns failed receipt response', async () => {
            const user = await createTestUser()
            const { receipt: failedReceipt } = await createFailedReceipt(user.id)

            const result = await getReceiptState(testDb, failedReceipt.id, user.id)


            expect(result.status).toEqual('failed')
            expect('attempts' in result).toBe(true)

            if ('attempts' in result) {
                expect(result.attempts).toBe(1)
            }
        })

        it('returns success for valid receipt', async () => {
            const user = await createTestUser()
            const { receipt } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10, quantity: 2 },
                { interpretedText: 'Item 2', price: 5, quantity: 1 },
            ])

            const result = await getReceiptState(testDb, receipt.id, user.id)

            // 1. Validate the state
            expect(result.status).toBe('valid')

            // 2. Narrow the type
            assertValid(result)

            // 3. Access properties safely
            expect(result.receipt.receiptId).toBe(receipt.id)
            expect(result.receipt.items).toHaveLength(2)
        })

        it('returns subtotal mismatch error', async () => {
            const user = await createTestUser()
            const { receipt: seededReceipt } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10, quantity: 2 },
            ])

            await testDb
                .update(receipt)
                .set({ subtotal: '5' })
                .where(eq(receipt.id, seededReceipt.id))

            const result = await getReceiptState(testDb, seededReceipt.id, user.id)

            // 2. Narrow the type
            assertSubtotalMismatch(result)

            // 3. Access properties
            expect(result.clientSubtotal).toBe(5)
        })

        it('returns grand total mismatch error', async () => {
            const user = await createTestUser()
            const { receipt: seededReceipt, items } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10, quantity: 2 },
            ])

            const correctSubtotal = items.reduce(
                (sum, item) => sum + Number(item.price) * Number(item.quantity ?? 1),
                0,
            )
            const wrongGrandTotal = correctSubtotal + 100

            await testDb
                .update(receipt)
                .set({
                    subtotal: correctSubtotal.toString(),
                    grandTotal: wrongGrandTotal.toString(),
                })
                .where(eq(receipt.id, seededReceipt.id))

            const result = await getReceiptState(testDb, seededReceipt.id, user.id)

            assertGrandTotalMismatch(result)

            expect(result.clientGrandTotal).toBe(wrongGrandTotal)
        })

        it('validates receipt calculations correctly', async () => {
            const user = await createTestUser()
            const items = [
                { interpretedText: 'Item 1', price: 10, quantity: 2 },
                { interpretedText: 'Item 2', price: 5, quantity: 1 },
            ]
            const { receipt } = await createSuccessfulReceipt(user.id, items)

            const result = await getReceiptWithItems(testDb, receipt.id, user.id)

            // 1. Narrow the type using the robust helper
            assertReceiptSuccess(result)

            // 2. Run logic
            const validation = validateReceiptCalculations(result)
            expect(validation.isValid).toBe(true)
        })
    })
})
