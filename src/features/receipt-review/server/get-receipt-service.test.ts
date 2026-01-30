import { fail } from 'node:assert';
import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { getReceiptState, getReceiptWithItems } from './get-receipt-service';
import type { ReceiptState } from './get-receipt-service';
import type { GetReceiptResponse } from './responses';
import { testDb } from '@/test/setup';
import { createTestUser } from '@/test/factories/user';
import {
  createFailedReceipt,
  createProcessingReceipt,
  createSuccessfulReceipt,
  createTestReceipt,
} from '@/test/factories/receipt';
import { NOT_FOUND, RECEIPT_PROCESSING } from '@/shared/server/response-types';
import { validateReceiptCalculations } from '@/shared/lib/money-math';
import { receipt } from '@/shared/server/db';

function assertReceiptSuccess(
  result: GetReceiptResponse,
): asserts result is Extract<GetReceiptResponse, { receiptId: string }> {
  // Checks specifically for the success signature (having an 'id' but no 'error')
  if (!('receiptId' in result) || 'error' in result) {
    throw new Error(`Expected receipt success, got: ${JSON.stringify(result)}`);
  }
}
/**
 * Asserts ReceiptState is success with validity 'valid'
 */
function assertValid(state: ReceiptState): asserts state is ReceiptState & {
  processingStatus: 'success';
  validity: { status: 'valid' };
  receipt: { receiptId: string; items: Array<unknown> };
} {
  if (state.processingStatus !== 'success') {
    throw new Error(
      `Expected processing status 'success', got '${state.processingStatus}'`,
    );
  }
  if (state.validity.status !== 'valid') {
    throw new Error(
      `Expected validity status 'valid', got '${state.validity.status}'`,
    );
  }
}

/**
 * Asserts ReceiptState is success with validity 'subtotal_mismatch'
 */
function assertSubtotalMismatch(
  state: ReceiptState,
): asserts state is ReceiptState & {
  processingStatus: 'success';
  validity: {
    status: 'subtotal_mismatch';
    clientSubtotal: number;
    serverSubtotal: number;
  };
} {
  if (state.processingStatus !== 'success') {
    throw new Error(
      `Expected processing status 'success', got '${state.processingStatus}'`,
    );
  }
  if (state.validity.status !== 'subtotal_mismatch') {
    throw new Error(
      `Expected validity status 'subtotal_mismatch', got '${state.validity.status}'`,
    );
  }
}

/**
 * Asserts ReceiptState is success with validity 'grandtotal_mismatch'
 */
function assertGrandTotalMismatch(
  state: ReceiptState,
): asserts state is ReceiptState & {
  processingStatus: 'success';
  validity: {
    status: 'grandtotal_mismatch';
    clientGrandTotal: number;
    serverGrandTotal: number;
  };
} {
  if (state.processingStatus !== 'success') {
    throw new Error(
      `Expected processing status 'success', got '${state.processingStatus}'`,
    );
  }
  if (state.validity.status !== 'grandtotal_mismatch') {
    throw new Error(
      `Expected validity status 'grandtotal_mismatch', got '${state.validity.status}'`,
    );
  }
}
describe('get-receipt-service', () => {
  describe('getReceiptWithItems', () => {
    it('returns NOT_FOUND for non-existent receipt', async () => {
      const nonExistentReceiptId = crypto.randomUUID();
      const result = await getReceiptWithItems(
        testDb,
        nonExistentReceiptId,
        'user-id',
      );

      expect(result).toEqual(NOT_FOUND);
    });

    it('returns RECEIPT_PROCESSING for processing receipt', async () => {
      const user = await createTestUser(testDb);
      const { receipt: processingReceipt } = await createProcessingReceipt(
        user.id,
        {},
        testDb,
      );

      const result = await getReceiptWithItems(
        testDb,
        processingReceipt.id,
        user.id,
      );

      expect(result).toEqual(RECEIPT_PROCESSING);
    });

    it('returns RECEIPT_PROCESSING for receipt with no processing info', async () => {
      const user = await createTestUser(testDb);
      const { receipt: receiptWithNoProcessing } = await createTestReceipt(
        user.id,
        {},
        {},
        testDb,
      );

      const result = await getReceiptWithItems(
        testDb,
        receiptWithNoProcessing.id,
        user.id,
      );

      expect(result).toEqual(RECEIPT_PROCESSING);
    });

    it('returns failed receipt response', async () => {
      const user = await createTestUser(testDb);
      const { receipt: failedReceipt } = await createFailedReceipt(
        user.id,
        testDb,
      );

      const result = await getReceiptWithItems(
        testDb,
        failedReceipt.id,
        user.id,
      );

      expect('attempts' in result).toBe(true);
      if ('attempts' in result) {
        expect(result.attempts).toBe(1);
      }
    });

    it('returns successful receipt with items', async () => {
      const user = await createTestUser(testDb);
      const { receipt: seededReceipt } = await createSuccessfulReceipt(
        user.id,
        [
          { interpretedText: 'Item 1', price: 10, quantity: 2 },
          { interpretedText: 'Item 2', price: 5, quantity: 1 },
        ],
        testDb,
      );

      const result = await getReceiptWithItems(
        testDb,
        seededReceipt.id,
        user.id,
      );

      assertReceiptSuccess(result);

      expect(result.receiptId).toBe(seededReceipt.id);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].interpretedText).toBe('Item 1');
      expect(result.items[1].interpretedText).toBe('Item 2');
    });

    it('returns receipt with roomId when room exists', async () => {
      const user = await createTestUser(testDb);
      const { receipt: seededReceipt } = await createSuccessfulReceipt(
        user.id,
        [{ interpretedText: 'Item 1', price: 10 }],
        testDb,
      );
      const { createTestRoom } = await import('@/test/factories/room');
      const room = await createTestRoom(testDb, seededReceipt.id, user.id);

      const result = await getReceiptWithItems(
        testDb,
        seededReceipt.id,
        user.id,
      );
      assertReceiptSuccess(result);

      expect(result.roomId).toBe(room.id);
    });

    it('does not return other users receipts', async () => {
      const user1 = await createTestUser(testDb);
      const user2 = await createTestUser(testDb);
      const { receipt: seededReceipt } = await createSuccessfulReceipt(
        user1.id,
        [{ interpretedText: 'Item 1', price: 10 }],
        testDb,
      );

      const result = await getReceiptWithItems(
        testDb,
        seededReceipt.id,
        user2.id,
      );

      expect(result).toEqual(NOT_FOUND);
    });
  });

  describe('getReceiptState', () => {
    it('throws not_found error for non-existent receipt', async () => {
      const nonExistentReceiptId = crypto.randomUUID();
      await expect(
        getReceiptState(testDb, nonExistentReceiptId, 'user-id'),
      ).rejects.toThrow();
    });

    it('returns processing for processing receipt', async () => {
      const user = await createTestUser(testDb);
      const { receipt: processingReceipt } = await createProcessingReceipt(
        user.id,
        {},
        testDb,
      );

      const result = await getReceiptState(
        testDb,
        processingReceipt.id,
        user.id,
      );

      expect(result.processingStatus).toEqual('processing');
    });

    it('returns failed receipt response', async () => {
      const user = await createTestUser(testDb);
      const { receipt: failedReceipt } = await createFailedReceipt(
        user.id,
        testDb,
      );

      const result = await getReceiptState(testDb, failedReceipt.id, user.id);

      expect(result.processingStatus).toEqual('failed');
      expect('attempts' in result).toBe(true);

      if ('attempts' in result) {
        expect(result.attempts).toBe(1);
      }
    });

    it('returns success for valid receipt', async () => {
      const user = await createTestUser(testDb);
      const { receipt: seededReceipt } = await createSuccessfulReceipt(
        user.id,
        [
          { interpretedText: 'Item 1', price: 10, quantity: 2 },
          { interpretedText: 'Item 2', price: 5, quantity: 1 },
        ],
        testDb,
      );

      const result = await getReceiptState(testDb, seededReceipt.id, user.id);

      // 1. Validate and narrow the state
      assertValid(result);

      // 2. Access properties (type is narrowed by assertion)
      expect(result.receipt.receiptId).toBe(seededReceipt.id);
      expect(result.receipt.items).toHaveLength(2);
    });

    it('returns subtotal mismatch error', async () => {
      const user = await createTestUser(testDb);
      const { receipt: seededReceipt } = await createSuccessfulReceipt(
        user.id,
        [{ interpretedText: 'Item 1', price: 10, quantity: 2 }],
        testDb,
      );

      await testDb
        .update(receipt)
        .set({ subtotal: '5' })
        .where(eq(receipt.id, seededReceipt.id));

      const result = await getReceiptState(testDb, seededReceipt.id, user.id);

      // 2. Narrow the type
      assertSubtotalMismatch(result);

      // 3. Access properties through validity
      // The server subtotal should be 5
      expect(result.validity.serverSubtotal).toBe(5);
      // Client is the one that is the calculated one based on the items
      expect(result.validity.clientSubtotal).toBe(10);
    });

    it('returns grand total mismatch error', async () => {
      const user = await createTestUser(testDb);
      const { receipt: seededReceipt, items } = await createSuccessfulReceipt(
        user.id,
        [{ interpretedText: 'Item 1', price: 10, quantity: 2 }],
        testDb,
      );

      const correctSubtotal = items.reduce(
        (sum, item) => sum + Number(item.price),
        0,
      );
      const wrongGrandTotal = correctSubtotal + 100;

      await testDb
        .update(receipt)
        .set({
          subtotal: correctSubtotal.toString(),
          grandTotal: wrongGrandTotal.toString(),
        })
        .where(eq(receipt.id, seededReceipt.id));

      const result = await getReceiptState(testDb, seededReceipt.id, user.id);

      assertGrandTotalMismatch(result);

      expect(result.validity.serverGrandTotal).toBe(wrongGrandTotal);
    });

    it('validates receipt calculations correctly', async () => {
      const user = await createTestUser(testDb);
      const items = [
        { interpretedText: 'Item 1', price: 10, quantity: 2 },
        { interpretedText: 'Item 2', price: 5, quantity: 1 },
      ];
      const { receipt: seededReceipt } = await createSuccessfulReceipt(
        user.id,
        items,
        testDb,
      );

      const result = await getReceiptWithItems(
        testDb,
        seededReceipt.id,
        user.id,
      );

      // 1. Narrow the type using the robust helper
      assertReceiptSuccess(result);

      // 2. Run logic
      const validation = validateReceiptCalculations(result);
      expect(validation.isValid).toBe(true);
    });
  });
});
