import { beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from 'cloudflare:test';
import { getRoomReceiptImageAccess } from './room-receipt-image-service';
import { testDb } from '@/test/setup';
import { createTestUser } from '@/test/factories/user';
import { createTestReceipt } from '@/test/factories/receipt';
import { createTestRoom, createTestRoomMember } from '@/test/factories/room';
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

describe('room-receipt-image-service', () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
  });

  it('returns ok for guest room members', async () => {
    const owner = await createTestUser(testDb);
    const { receipt } = await createTestReceipt(owner.id, {}, {}, testDb);
    const testRoom = await createTestRoom(testDb, receipt.id, owner.id);
    const guestUuid = crypto.randomUUID();

    await createTestRoomMember(testDb, testRoom.id, { guestUuid });
    await env.parcener_receipt_images.put(receipt.id, 'image-bytes', {
      httpMetadata: { contentType: 'image/jpeg' },
    });

    mockSession();

    const request = new Request('http://localhost', {
      headers: {
        cookie: `guest_uuid_room_${testRoom.id}=${guestUuid}`,
      },
    });

    const result = await getRoomReceiptImageAccess({
      request,
      roomId: testRoom.id,
      db: testDb,
      env,
      auth: {} as any,
    });

    expect(result.type).toBe('ok');
    if (result.type === 'ok') {
      expect(result.image.httpMetadata?.contentType).toBe('image/jpeg');
    }
  });

  it('returns forbidden for non-member guests', async () => {
    const owner = await createTestUser(testDb);
    const { receipt } = await createTestReceipt(owner.id, {}, {}, testDb);
    const testRoom = await createTestRoom(testDb, receipt.id, owner.id);

    mockSession();

    const request = new Request('http://localhost');

    const result = await getRoomReceiptImageAccess({
      request,
      roomId: testRoom.id,
      db: testDb,
      env,
      auth: {} as any,
    });

    expect(result.type).toBe('forbidden');
  });

  it('returns ok for receipt owner without membership', async () => {
    const owner = await createTestUser(testDb);
    const { receipt } = await createTestReceipt(owner.id, {}, {}, testDb);
    const testRoom = await createTestRoom(testDb, receipt.id, owner.id);

    await env.parcener_receipt_images.put(receipt.id, 'image-bytes', {
      httpMetadata: { contentType: 'image/png' },
    });

    mockSession({ id: owner.id, name: owner.name });

    const request = new Request('http://localhost');

    const result = await getRoomReceiptImageAccess({
      request,
      roomId: testRoom.id,
      db: testDb,
      env,
      auth: {} as any,
    });

    expect(result.type).toBe('ok');
  });

  // We want to return not_found to not leak room ids, that a rool exists
  it('returns notfound for non-owner user without membership', async () => {
    const owner = await createTestUser(testDb);
    const otherUser = await createTestUser(testDb);
    const { receipt } = await createTestReceipt(owner.id, {}, {}, testDb);
    const testRoom = await createTestRoom(testDb, receipt.id, owner.id);

    mockSession({ id: otherUser.id, name: otherUser.name });

    const request = new Request('http://localhost');

    const result = await getRoomReceiptImageAccess({
      request,
      roomId: testRoom.id,
      db: testDb,
      env,
      auth: {} as any,
    });

    expect(result.type).toBe('not_found');
  });

  it('returns not_found when room does not exist', async () => {
    const user = await createTestUser(testDb);
    mockSession({ id: user.id, name: user.name });

    const request = new Request('http://localhost');

    const result = await getRoomReceiptImageAccess({
      request,
      roomId: crypto.randomUUID(),
      db: testDb,
      env,
      auth: {} as any,
    });

    expect(result.type).toBe('not_found');
  });

  it('returns not_found when image is missing', async () => {
    const owner = await createTestUser(testDb);
    const { receipt } = await createTestReceipt(owner.id, {}, {}, testDb);
    const testRoom = await createTestRoom(testDb, receipt.id, owner.id);

    mockSession({ id: owner.id, name: owner.name });

    const request = new Request('http://localhost');

    const result = await getRoomReceiptImageAccess({
      request,
      roomId: testRoom.id,
      db: testDb,
      env,
      auth: {} as any,
    });

    expect(result.type).toBe('not_found');
  });
});
