import { beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from 'cloudflare:test';
import { getOwnedReceiptImageAccess } from './receipt-image-access-service';
import { testDb } from '@/test/setup';
import { createTestUser } from '@/test/factories/user';
import { createTestReceipt } from '@/test/factories/receipt';
import { getServerSession } from '@/shared/auth/server/get-server-session';

vi.mock('@/shared/auth/server/get-server-session', () => ({
  getServerSession: vi.fn(),
}));

const getServerSessionMock = vi.mocked(getServerSession);

function mockSession(user?: { id: string; name?: string; email?: string }) {
  if (!user) {
    getServerSessionMock.mockResolvedValue(null);
    return;
  }

  getServerSessionMock.mockResolvedValue({ user } as any);
}

describe('receipt-image-access-service', () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
  });

  it('returns forbidden when unauthenticated', async () => {
    const owner = await createTestUser(testDb);
    const { receipt } = await createTestReceipt(owner.id, {}, {}, testDb);

    mockSession();

    const result = await getOwnedReceiptImageAccess({
      request: new Request('http://localhost'),
      receiptId: receipt.id,
      db: testDb,
      env,
      auth: {} as any,
    });

    expect(result.type).toBe('forbidden');
  });

  it('returns not_found when receipt does not exist', async () => {
    const user = await createTestUser(testDb);
    mockSession({ id: user.id, name: user.name });

    const result = await getOwnedReceiptImageAccess({
      request: new Request('http://localhost'),
      receiptId: crypto.randomUUID(),
      db: testDb,
      env,
      auth: {} as any,
    });

    expect(result.type).toBe('not_found');
  });

  it('returns not_found when user does not own receipt', async () => {
    const owner = await createTestUser(testDb);
    const other = await createTestUser(testDb);
    const { receipt } = await createTestReceipt(owner.id, {}, {}, testDb);

    mockSession({ id: other.id, name: other.name });

    const result = await getOwnedReceiptImageAccess({
      request: new Request('http://localhost'),
      receiptId: receipt.id,
      db: testDb,
      env,
      auth: {} as any,
    });

    expect(result.type).toBe('not_found');
  });

  it('returns not_found when image is missing', async () => {
    const owner = await createTestUser(testDb);
    const { receipt } = await createTestReceipt(owner.id, {}, {}, testDb);

    mockSession({ id: owner.id, name: owner.name });

    const result = await getOwnedReceiptImageAccess({
      request: new Request('http://localhost'),
      receiptId: receipt.id,
      db: testDb,
      env,
      auth: {} as any,
    });

    expect(result.type).toBe('not_found');
  });

  it('returns ok for receipt owner', async () => {
    const owner = await createTestUser(testDb);
    const { receipt } = await createTestReceipt(owner.id, {}, {}, testDb);
    await env.parcener_receipt_images.put(receipt.id, 'image-bytes', {
      httpMetadata: { contentType: 'image/jpeg' },
    });

    mockSession({ id: owner.id, name: owner.name });

    const result = await getOwnedReceiptImageAccess({
      request: new Request('http://localhost'),
      receiptId: receipt.id,
      db: testDb,
      env,
      auth: {} as any,
    });

    expect(result.type).toBe('ok');
  });
});
