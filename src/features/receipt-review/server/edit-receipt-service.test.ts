import { describe, it, expect } from 'vitest'
import { testDb } from '@/test/setup'
import { createTestUser } from '@/test/factories/user'
import { createFailedReceipt, createProcessingReceipt, createSuccessfulReceipt } from '@/test/factories/receipt'
import {
    createTestRoom,
    createTestRoomMember,
    createTestClaim,
} from '@/test/factories/room'
import {
    editReceiptItem,
    createReceiptItem,
    deleteReceiptItem,
    finalizeReceiptTotals,
} from './edit-receipt-service'
import {
    NOT_FOUND,
    RECEIPT_PROCESSING,
} from '@/shared/server/response-types'
import { claim, receipt, receiptItem, room } from '@/shared/server/db'
import { eq } from 'drizzle-orm'

describe('edit-receipt-service', () => {
    describe('editReceiptItem', () => {
        it('updates receipt item', async () => {
            const user = await createTestUser()
            const { items } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10, quantity: 2 },
            ])

            const result = await editReceiptItem(
                testDb,
                {
                    receiptItemId: items[0].id,
                    interpretedText: 'Updated Item',
                    price: 15,
                    quantity: 3,
                    rawText: null,
                },
                user.id,
            )

            expect(result?.interpretedText).toBe('Updated Item')
            expect(result?.price).toBe(15)
            expect(result?.quantity).toBe(3)
        })

        it('prunes excess claims when reducing quantity', async () => {
            const user1 = await createTestUser()
            const user2 = await createTestUser()
            const { receipt, items } = await createSuccessfulReceipt(user1.id, [
                { interpretedText: 'Item 1', price: 10, quantity: 5 },
            ])
            const room = await createTestRoom(receipt.id, user1.id)
            const member1 = await createTestRoomMember(room.id, { userId: user1.id })
            const member2 = await createTestRoomMember(room.id, { userId: user2.id })
            await createTestClaim(room.id, member1.id, items[0].id, 2)
            await createTestClaim(room.id, member2.id, items[0].id, 2)

            await editReceiptItem(
                testDb,
                {
                    receiptItemId: items[0].id,
                    interpretedText: 'Item 1',
                    price: 10,
                    quantity: 3,
                    rawText: null,
                },
                user1.id,
            )

            const claims = await testDb.query.claim.findMany({
                where: eq(claim.receiptItemId, items[0].id)
            })

            expect(claims.length).toBeLessThanOrEqual(1)
        })
    })

    describe('createReceiptItem', () => {
        it('creates a new receipt item', async () => {
            const user = await createTestUser()
            const { receipt } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10 },
            ])

            const result = await createReceiptItem(
                testDb,
                {
                    interpretedText: 'New Item',
                    price: 15,
                    quantity: 2,
                    rawText: null,
                },
                receipt.id,
                user.id,
            )

            expect(result?.interpretedText).toBe('New Item')
            expect(result?.price).toBe(15)
            expect(result?.quantity).toBe(2)
        })

        it('adds item to receipt', async () => {
            const user = await createTestUser()
            const { receipt } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10 },
            ])

            await createReceiptItem(
                testDb,
                {
                    interpretedText: 'Item 2',
                    price: 20,
                    quantity: 1,
                    rawText: null,
                },
                receipt.id,
                user.id,
            )

            const items = await testDb.query.receiptItem.findMany({
                where: eq(receiptItem.receiptId, receipt.id)
            })

            expect(items).toHaveLength(2)
        })
    })

    describe('deleteReceiptItem', () => {
        it('deletes receipt item', async () => {
            const user = await createTestUser()
            const { receipt, items } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10, quantity: 2 },
            ])

            await deleteReceiptItem(
                testDb,
                {
                    receiptItemId: items[0].id,
                    interpretedText: 'Item 1',
                    price: 10,
                    quantity: 2,
                    rawText: null,
                },
                user.id,
            )

            const itemsAfter = await testDb.query.receiptItem.findMany({
                where: eq(receiptItem.receiptId, receipt.id)
            })

            expect(itemsAfter).toHaveLength(0)
        })

        it('returns gracefully for non-existent item', async () => {
            const user = await createTestUser()

            await expect(
                deleteReceiptItem(
                    testDb,
                    {
                        receiptItemId: '00000000-0000-0000-0000-000000000000',
                        interpretedText: 'Item',
                        price: 10,
                        quantity: 1,
                        rawText: null,
                    },
                    user.id,
                ),
            ).resolves.not.toThrow()
        })
    })

    describe('finalizeReceiptTotals', () => {
        it('finalizes receipt totals successfully', async () => {
            const user = await createTestUser()
            const { receipt: seededReceipt, items } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10, quantity: 2 },
                { interpretedText: 'Item 2', price: 5, quantity: 1 },
            ])

            const subtotal = items.reduce(
                (sum, item) => sum + Number(item.price) * (Number(item.quantity) ?? 1),
                0,
            )
            const tax = 2.5
            const tip = 5
            const grandTotal = subtotal + tax + tip

            const result = await finalizeReceiptTotals(
                testDb,
                {
                    receiptId: seededReceipt.id,
                    subtotal,
                    tax,
                    tip,
                    grandTotal,
                },
                user.id,
            )

            expect(result).toEqual({ success: true })

            const updatedReceipt = await testDb.query.receipt.findFirst({
                where: eq(receipt.id, seededReceipt.id)
            })

            expect(updatedReceipt?.subtotal).toBe(subtotal.toString())
            expect(updatedReceipt?.tax).toBe(tax.toString())
            expect(updatedReceipt?.tip).toBe(tip.toString())
            expect(updatedReceipt?.grandTotal).toBe(grandTotal.toString())
        })

        it('touches room when finalizing totals', async () => {
            const user = await createTestUser()
            const { receipt } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10 },
            ])
            const seededRoom = await createTestRoom(receipt.id, user.id)

            const before = await testDb.query.room.findFirst({
                where: eq(room.id, seededRoom.id)
            })

            await finalizeReceiptTotals(
                testDb,
                {
                    receiptId: receipt.id,
                    subtotal: 10,
                    tax: 0,
                    tip: 0,
                    grandTotal: 10,
                },
                user.id,
            )

            const after = await testDb.query.room.findFirst({
                where: eq(room.id, seededRoom.id)
            })

            expect(after?.updatedAt.getTime()).toBeGreaterThan(
                before?.updatedAt.getTime() || 0,
            )
        })

        it('returns NOT_FOUND for non-existent receipt', async () => {
            const user = await createTestUser()

            const result = await finalizeReceiptTotals(
                testDb,
                {
                    receiptId: '00000000-0000-0000-0000-000000000000',
                    subtotal: 10,
                    tax: 0,
                    tip: 0,
                    grandTotal: 10,
                },
                user.id,
            )

            expect(result).toEqual(NOT_FOUND)
        })

        it('returns RECEIPT_PROCESSING for processing receipt', async () => {
            const user = await createTestUser()
            const { receipt: processingReceipt } = await createProcessingReceipt(
                user.id,
            )

            const result = await finalizeReceiptTotals(
                testDb,
                {
                    receiptId: processingReceipt.id,
                    subtotal: 10,
                    tax: 0,
                    tip: 0,
                    grandTotal: 10,
                },
                user.id,
            )

            expect(result).toEqual(RECEIPT_PROCESSING)
        })

        it('returns failed receipt response', async () => {
            const user = await createTestUser()
            const { receipt: failedReceipt } = await createFailedReceipt(user.id)

            const result = await finalizeReceiptTotals(
                testDb,
                {
                    receiptId: failedReceipt.id,
                    subtotal: 10,
                    tax: 0,
                    tip: 0,
                    grandTotal: 10,
                },
                user.id,
            )

            expect('attempts' in result).toBe(true)
        })

        it('returns subtotal mismatch error', async () => {
            const user = await createTestUser()
            const { receipt } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10, quantity: 2 },
            ])

            const result = await finalizeReceiptTotals(
                testDb,
                {
                    receiptId: receipt.id,
                    subtotal: 999,
                    tax: 0,
                    tip: 0,
                    grandTotal: 999,
                },
                user.id,
            )

            expect(result).toBe(
                { success: false, error: 'checksum_failed' }
            )
        })

        it('returns grand total mismatch error', async () => {
            const user = await createTestUser()
            const { receipt, items } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10, quantity: 2 },
            ])

            const subtotal = items.reduce(
                (sum, item) => sum + Number(item.price) * Number(item.quantity ?? 1),
                0,
            )
            const wrongGrandTotal = subtotal + 100

            const result = await finalizeReceiptTotals(
                testDb,
                {
                    receiptId: receipt.id,
                    subtotal,
                    tax: 0,
                    tip: 0,
                    grandTotal: wrongGrandTotal,
                },
                user.id,
            )

            expect(result).toBe(
                { success: false, error: 'checksum_failed' }
            )
        })
    })
})
