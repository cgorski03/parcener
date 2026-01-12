import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import {
  createTestReceipt,
  createTestRoom,
  createTestRoomMember,
  createTestUser,
} from '@/test/factories';
import {
  getRecentReceipts,
  getRecentRooms,
} from '@/features/dashboard/server/recent-activity-service';
import { testDb } from '@/test/setup';
import { user } from '@/shared/server/db/auth-schema';

describe('getRecentReceipts', () => {
  it('returns null for user without upload permission', async () => {
    const userEntity = await createTestUser(testDb, { canUpload: false });

    const result = await getRecentReceipts(testDb, userEntity);

    expect(result).toBeNull();
  });

  it('returns empty array for user with no receipts', async () => {
    const userEntity = await createTestUser(testDb, { canUpload: true });

    const result = await getRecentReceipts(testDb, userEntity);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result!.length).toBe(0);
  });

  it('returns user most recent receipts', async () => {
    const userEntity = await createTestUser(testDb, { canUpload: true });

    await createTestReceipt(
      userEntity.id,
      {
        title: 'Receipt 1',
        createdAt: new Date('2025-01-06T10:00:00Z'),
      },
      {},
      testDb,
    );
    await createTestReceipt(
      userEntity.id,
      {
        title: 'Receipt 2',
        createdAt: new Date('2025-01-06T09:00:00Z'),
      },
      {},
      testDb,
    );
    await createTestReceipt(
      userEntity.id,
      {
        title: 'Receipt 3',
        createdAt: new Date('2025-01-06T11:00:00Z'),
      },
      {},
      testDb,
    );

    const result = await getRecentReceipts(testDb, userEntity);

    expect(result).toBeDefined();
    expect(result!.length).toBe(3);
    expect(result![0].title).toBe('Receipt 3');
    expect(result![1].title).toBe('Receipt 2');
    expect(result![2].title).toBe('Receipt 1');
  });

  it('returns null for user without upload permission', async () => {
    const userEntity = await createTestUser(testDb, { canUpload: true });

    await createTestReceipt(
      userEntity.id,
      {
        title: 'Old Receipt',
      },
      {},
      testDb,
    );

    await testDb
      .update(user)
      .set({ canUpload: false })
      .where(eq(user.id, userEntity.id));

    const updatedUser = { ...userEntity, canUpload: false };

    const result = await getRecentReceipts(testDb, updatedUser);

    expect(result).toBeNull();
  });
});

describe('getRecentRooms', () => {
  it('returns empty array for user with no rooms', async () => {
    const seededUser = await createTestUser(testDb, { canUpload: true });

    const result = await getRecentRooms(testDb, seededUser);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it('returns user recent rooms ordered by join date', async () => {
    const user1 = await createTestUser(testDb, { canUpload: true });
    const user2 = await createTestUser(testDb, { canUpload: true });

    const receipt1 = await createTestReceipt(user1.id, {}, {}, testDb);
    const receipt2 = await createTestReceipt(user1.id, {}, {}, testDb);
    const room1 = await createTestRoom(testDb, receipt1.receipt.id, user1.id, {
      title: 'Room 1',
    });
    const room2 = await createTestRoom(testDb, receipt2.receipt.id, user1.id, {
      title: 'Room 2',
    });

    await createTestRoomMember(testDb, room1.id, {
      userId: user1.id,
      joinedAt: new Date('2025-01-06T12:00:00Z'),
    });

    await createTestRoomMember(testDb, room2.id, {
      userId: user1.id,
      joinedAt: new Date('2025-01-06T11:00:00Z'),
    });

    await createTestRoomMember(testDb, room1.id, {
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
    const user1 = await createTestUser(testDb, { canUpload: true });
    const user2 = await createTestUser(testDb, { canUpload: true });

    const receipt1 = await createTestReceipt(user1.id, {}, {}, testDb);
    const receipt2 = await createTestReceipt(user1.id, {}, {}, testDb);
    const room1 = await createTestRoom(testDb, receipt1.receipt.id, user1.id, {
      title: 'Room 1',
    });
    const room2 = await createTestRoom(testDb, receipt2.receipt.id, user2.id, {
      title: 'Room 2',
    });

    await createTestRoomMember(testDb, room1.id, { userId: user1.id });
    await createTestRoomMember(testDb, room2.id, { userId: user2.id });

    const result = await getRecentRooms(testDb, user1);

    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(result[0].room.roomId).toBe(room1.id);
  });

  it('returns rooms for user without upload permission', async () => {
    const userEntity = await createTestUser(testDb, { canUpload: true });

    const receipt = await createTestReceipt(userEntity.id, {}, {}, testDb);
    const room = await createTestRoom(
      testDb,
      receipt.receipt.id,
      userEntity.id,
      {
        title: 'Existing Room',
      },
    );
    await createTestRoomMember(testDb, room.id, { userId: userEntity.id });

    await testDb
      .update(user)
      .set({ canUpload: false })
      .where(eq(user.id, userEntity.id));

    const updatedUser = { ...userEntity, canUpload: false };

    const result = await getRecentRooms(testDb, updatedUser);

    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(result[0].room.roomId).toBe(room.id);
  });
});
