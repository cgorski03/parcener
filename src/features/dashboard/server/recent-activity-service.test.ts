import { describe, it, expect } from 'vitest';
import {
  createTestUser,
  createTestReceipt,
  createTestRoom,
  createTestRoomMember,
} from '@/test/factories';
import {
  getRecentReceipts,
  getRecentRooms,
} from '@/features/dashboard/server/recent-activity-service';
import { testDb } from '@/test/setup';

describe('getRecentReceipts', () => {
  it('returns null for user without upload permission', async () => {
    const user = await createTestUser({ canUpload: false });

    const result = await getRecentReceipts(testDb, user);

    expect(result).toBeNull();
  });

  it('returns empty array for user with no receipts', async () => {
    const user = await createTestUser({ canUpload: true });

    const result = await getRecentReceipts(testDb, user);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result!.length).toBe(0);
  });

  it('returns user most recent receipts', async () => {
    const user = await createTestUser({ canUpload: true });

    await createTestReceipt(user.id, {
      title: 'Receipt 1',
      createdAt: new Date('2025-01-06T10:00:00Z'),
    });
    await createTestReceipt(user.id, {
      title: 'Receipt 2',
      createdAt: new Date('2025-01-06T09:00:00Z'),
    });
    await createTestReceipt(user.id, {
      title: 'Receipt 3',
      createdAt: new Date('2025-01-06T11:00:00Z'),
    });

    const result = await getRecentReceipts(testDb, user);

    expect(result).toBeDefined();
    expect(result!.length).toBe(3);
    expect(result![0].title).toBe('Receipt 3');
    expect(result![1].title).toBe('Receipt 2');
    expect(result![2].title).toBe('Receipt 1');
  });
});

describe('getRecentRooms', () => {
  it('returns empty array for user with no rooms', async () => {
    const user = await createTestUser({ canUpload: true });

    const result = await getRecentRooms(testDb, user);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it('returns user recent rooms ordered by join date', async () => {
    const user1 = await createTestUser({ canUpload: true });
    const user2 = await createTestUser({ canUpload: true });

    const receipt1 = await createTestReceipt(user1.id);
    const receipt2 = await createTestReceipt(user1.id);

    const room1 = await createTestRoom(receipt1.receipt.id, user1.id, {
      title: 'Room 1',
    });
    const room2 = await createTestRoom(receipt2.receipt.id, user1.id, {
      title: 'Room 2',
    });

    await createTestRoomMember(room1.id, {
      userId: user1.id,
      joinedAt: new Date('2025-01-06T12:00:00Z'),
    });

    await createTestRoomMember(room2.id, {
      userId: user1.id,
      joinedAt: new Date('2025-01-06T11:00:00Z'),
    });

    await createTestRoomMember(room1.id, {
      userId: user2.id,
      joinedAt: new Date('2025-01-06T08:00:00Z'),
    });

    const result = await getRecentRooms(testDb, user1);

    expect(result).toBeDefined();
    expect(result.length).toBe(2);
    expect(result[0].room.roomId).toBe(room2.id);
    expect(result[1].room.roomId).toBe(room1.id);
  });

  it('only returns rooms for requesting user', async () => {
    const user1 = await createTestUser({ canUpload: true });
    const user2 = await createTestUser({ canUpload: true });

    const receipt1 = await createTestReceipt(user1.id);
    const receipt2 = await createTestReceipt(user2.id);

    const room1 = await createTestRoom(receipt1.receipt.id, user1.id, {
      title: 'Room 1',
    });
    const room2 = await createTestRoom(receipt2.receipt.id, user2.id, {
      title: 'Room 2',
    });

    await createTestRoomMember(room1.id, { userId: user1.id });
    await createTestRoomMember(room2.id, { userId: user2.id });

    const result = await getRecentRooms(testDb, user1);

    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(result[0].room.roomId).toBe(room1.id);
  });
});
