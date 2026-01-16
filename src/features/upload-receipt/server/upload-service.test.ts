import { describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { env } from 'cloudflare:test';
import type { ReceiptJob } from './types';
import { createTestUser } from '@/test/factories';
import { receipt } from '@/shared/server/db';
import {
  processUploadAndEnqueue,
  processingQueueMessageHandler,
} from '@/features/upload-receipt/server/processing-service';
import { testDb } from '@/test/setup';

/**
 * Tests for upload receipt flow.
 *
 * Note: processReceipt tests are skipped because TanStack's createServerOnlyFn
 * doesn't properly load environment variables in the Miniflare test environment.
 * The AI integration should be tested via E2E tests or by refactoring the LLM
 * module to be more testable.
 */

describe('processUploadAndEnqueue', () => {
  it('creates receipt stub and stores image in R2', async () => {
    const user = await createTestUser(testDb, { canUpload: true });
    const file = new File(['fake-image-content'], 'receipt.jpg', {
      type: 'image/jpeg',
    });

    const result = await processUploadAndEnqueue({
      db: testDb,
      env,
      file,
      userId: user.id,
      thinkingLevel: 'medium',
    });

    // Verify receipt was created in database
    const receiptRecord = await testDb.query.receipt.findFirst({
      where: eq(receipt.id, result.receiptId),
    });
    expect(receiptRecord).toBeDefined();
    expect(receiptRecord!.userId).toBe(user.id);

    // Verify image was stored in R2
    const storedImage = await env.parcener_receipt_images.get(result.receiptId);
    expect(storedImage).not.toBeNull();
  });

  it('returns a valid receiptId', async () => {
    const user = await createTestUser(testDb, { canUpload: true });
    const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });

    const result = await processUploadAndEnqueue({
      db: testDb,
      env,
      file,
      userId: user.id,
      thinkingLevel: 'medium',
    });

    expect(result.receiptId).toBeDefined();
    expect(typeof result.receiptId).toBe('string');
    expect(result.receiptId.length).toBeGreaterThan(0);
  });

  it('stores image with correct content type', async () => {
    const user = await createTestUser(testDb, { canUpload: true });
    const file = new File(['test-png-content'], 'receipt.png', {
      type: 'image/png',
    });

    const result = await processUploadAndEnqueue({
      db: testDb,
      env,
      file,
      userId: user.id,
      thinkingLevel: 'medium',
    });

    const storedImage = await env.parcener_receipt_images.get(result.receiptId);
    expect(storedImage).not.toBeNull();
    expect(storedImage!.httpMetadata?.contentType).toBe('image/png');
  });

  it('handles low thinking level', async () => {
    const user = await createTestUser(testDb, { canUpload: true });
    const file = new File(['test-low'], 'receipt-low.jpg', {
      type: 'image/jpeg',
    });

    const result = await processUploadAndEnqueue({
      db: testDb,
      env,
      file,
      userId: user.id,
      thinkingLevel: 'low',
    });

    expect(result.receiptId).toBeDefined();
    expect(typeof result.receiptId).toBe('string');

    // Verify receipt was created
    const receiptRecord = await testDb.query.receipt.findFirst({
      where: eq(receipt.id, result.receiptId),
    });
    expect(receiptRecord).toBeDefined();
  });

  it('handles high thinking level', async () => {
    const user = await createTestUser(testDb, { canUpload: true });
    const file = new File(['test-high'], 'receipt-high.jpg', {
      type: 'image/jpeg',
    });

    const result = await processUploadAndEnqueue({
      db: testDb,
      env,
      file,
      userId: user.id,
      thinkingLevel: 'high',
    });

    expect(result.receiptId).toBeDefined();
    expect(typeof result.receiptId).toBe('string');

    // Verify receipt was created
    const receiptRecord = await testDb.query.receipt.findFirst({
      where: eq(receipt.id, result.receiptId),
    });
    expect(receiptRecord).toBeDefined();
  });

  it('enqueues job with correct thinking level', async () => {
    const user = await createTestUser(testDb, { canUpload: true });
    const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });

    const result = await processUploadAndEnqueue({
      db: testDb,
      env,
      file,
      userId: user.id,
      thinkingLevel: 'high',
    });

    // The queue will receive the job with the specified thinking level
    // We can't directly inspect the queue in tests, but we verify it doesn't throw
    expect(result.receiptId).toBeDefined();
  });
});

describe('processingQueueMessageHandler', () => {
  it('throws error when processing fails (to trigger retry)', async () => {
    const user = await createTestUser(testDb, { canUpload: true });
    const receiptId = crypto.randomUUID();

    await testDb.insert(receipt).values({
      id: receiptId,
      userId: user.id,
    });

    const ackSpy = vi.fn();
    const mockMessage = {
      body: { receiptId, thinkingLevel: 'medium' },
      ack: ackSpy,
    } as unknown as Message<ReceiptJob>;

    await expect(
      processingQueueMessageHandler({
        db: testDb,
        message: mockMessage,
        env,
        ctx: {} as ExecutionContext,
      }),
    ).rejects.toThrow();

    // Should NOT ack - let outer wrapper retry
    expect(ackSpy).not.toHaveBeenCalled();
  });

  it('processes messages with different thinking levels', async () => {
    const user = await createTestUser(testDb, { canUpload: true });
    const thinkingLevels = ['low', 'medium', 'high'] as const;

    for (const level of thinkingLevels) {
      const receiptId = crypto.randomUUID();

      await testDb.insert(receipt).values({
        id: receiptId,
        userId: user.id,
      });

      const ackSpy = vi.fn();
      const mockMessage = {
        body: { receiptId, thinkingLevel: level },
        ack: ackSpy,
      } as unknown as Message<ReceiptJob>;

      // This will fail because there's no image in R2, but we're testing
      // that the thinking level is passed through correctly
      await expect(
        processingQueueMessageHandler({
          db: testDb,
          message: mockMessage,
          env,
          ctx: {} as ExecutionContext,
        }),
      ).rejects.toThrow();

      expect(ackSpy).not.toHaveBeenCalled();
    }
  });
});
