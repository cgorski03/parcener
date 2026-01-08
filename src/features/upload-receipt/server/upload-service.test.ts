import { describe, it, expect, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { createTestUser } from '@/test/factories';
import { receipt } from '@/shared/server/db';
import {
  processUploadAndEnqueue,
  processingQueueMessageHandler,
} from '@/features/upload-receipt/server/processing-service';
import { testDb } from '@/test/setup';
import { env } from 'cloudflare:test';

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
    const user = await createTestUser({ canUpload: true });
    const file = new File(['fake-image-content'], 'receipt.jpg', {
      type: 'image/jpeg',
    });

    const result = await processUploadAndEnqueue(testDb, env, file, user.id);

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
    const user = await createTestUser({ canUpload: true });
    const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });

    const result = await processUploadAndEnqueue(testDb, env, file, user.id);

    expect(result.receiptId).toBeDefined();
    expect(typeof result.receiptId).toBe('string');
    expect(result.receiptId.length).toBeGreaterThan(0);
  });

  it('stores image with correct content type', async () => {
    const user = await createTestUser({ canUpload: true });
    const file = new File(['test-png-content'], 'receipt.png', {
      type: 'image/png',
    });

    const result = await processUploadAndEnqueue(testDb, env, file, user.id);

    const storedImage = await env.parcener_receipt_images.get(result.receiptId);
    expect(storedImage).not.toBeNull();
    expect(storedImage!.httpMetadata?.contentType).toBe('image/png');
  });
});

describe('processingQueueMessageHandler', () => {
  it('throws error when processing fails (to trigger retry)', async () => {
    const user = await createTestUser({ canUpload: true });
    const receiptId = crypto.randomUUID();

    await testDb.insert(receipt).values({
      id: receiptId,
      userId: user.id,
    });

    const ackSpy = vi.fn();
    const mockMessage = {
      body: { receiptId },
      ack: ackSpy,
    } as unknown as Message<{ receiptId: string }>;

    await expect(
      processingQueueMessageHandler(
        testDb,
        mockMessage,
        env,
        {} as ExecutionContext,
      ),
    ).rejects.toThrow();

    // Should NOT ack - let outer wrapper retry
    expect(ackSpy).not.toHaveBeenCalled();
  });
});
