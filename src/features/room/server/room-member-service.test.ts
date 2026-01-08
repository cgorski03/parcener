import { describe, it, expect } from 'vitest';
import { testDb } from '@/test/setup';
import { createTestUser } from '@/test/factories/user';
import { createSuccessfulReceipt } from '@/test/factories/receipt';
import { createTestRoom, createTestRoomMember } from '@/test/factories/room';
import { RoomIdentity } from '@/shared/auth/server/room-identity';
import { room } from '@/shared/server/db/schema';
import { eq } from 'drizzle-orm';
import {
  getRoomMembership,
  getRoomMembershipByUserId,
  getRoomMembershipByGuestId,
  editRoomMemberDisplayName,
  upgradeRoomMember,
  resolveMembershipState,
} from './room-member-service';

describe('room-member-service', () => {
  describe('getRoomMembershipByUserId', () => {
    it('returns membership for user', async () => {
      const user = await createTestUser();
      const { receipt } = await createSuccessfulReceipt(user.id, [
        { interpretedText: 'Item 1', price: 10 },
      ]);
      const room = await createTestRoom(receipt.id, user.id);
      const member = await createTestRoomMember(room.id, {
        userId: user.id,
        displayName: 'Test User',
      });

      const result = await getRoomMembershipByUserId(testDb, room.id, user.id);

      expect(result).toBeDefined();
      expect(result?.roomMemberId).toBe(member.id);
      expect(result?.userId).toBe(user.id);
      expect(result?.displayName).toBe('Test User');
    });

    it('returns null for non-existent membership', async () => {
      const user = await createTestUser();

      const result = await getRoomMembershipByUserId(
        testDb,
        '00000000-0000-0000-0000-000000000000',
        user.id,
      );

      expect(result).toBeNull();
    });

    it('returns null for different user in room', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const { receipt } = await createSuccessfulReceipt(user1.id, [
        { interpretedText: 'Item 1', price: 10 },
      ]);
      const room = await createTestRoom(receipt.id, user1.id);
      await createTestRoomMember(room.id, { userId: user1.id });

      const result = await getRoomMembershipByUserId(testDb, room.id, user2.id);

      expect(result).toBeNull();
    });
  });

  describe('getRoomMembershipByGuestId', () => {
    it('returns membership for guest', async () => {
      const user = await createTestUser();
      const { receipt } = await createSuccessfulReceipt(user.id, [
        { interpretedText: 'Item 1', price: 10 },
      ]);
      const room = await createTestRoom(receipt.id, user.id);
      const guestUuid = crypto.randomUUID();
      const member = await createTestRoomMember(room.id, {
        guestUuid,
        displayName: 'Guest',
      });

      const result = await getRoomMembershipByGuestId(
        testDb,
        room.id,
        guestUuid,
      );

      expect(result).toBeDefined();
      expect(result?.roomMemberId).toBe(member.id);
      expect(result?.guestUuid).toBe(guestUuid);
    });
  });

  describe('getRoomMembership', () => {
    it('returns user membership when userId is provided', async () => {
      const user = await createTestUser();
      const { receipt } = await createSuccessfulReceipt(user.id, [
        { interpretedText: 'Item 1', price: 10 },
      ]);
      const room = await createTestRoom(receipt.id, user.id);
      await createTestRoomMember(room.id, {
        userId: user.id,
        displayName: 'Test User',
      });

      const identity: RoomIdentity = {
        userId: user.id,
        isAuthenticated: true,
        name: 'Test',
      };

      const result = await getRoomMembership(testDb, identity, room.id);

      expect(result).toBeDefined();
      expect(result?.userId).toBe(user.id);
    });

    it('returns guest membership when guestUuid is provided', async () => {
      const user = await createTestUser();
      const { receipt } = await createSuccessfulReceipt(user.id, [
        { interpretedText: 'Item 1', price: 10 },
      ]);
      const room = await createTestRoom(receipt.id, user.id);
      const guestUuid = crypto.randomUUID();
      await createTestRoomMember(room.id, { guestUuid, displayName: 'Guest' });

      const identity: RoomIdentity = { guestUuid, isAuthenticated: false };

      const result = await getRoomMembership(testDb, identity, room.id);

      expect(result).toBeDefined();
      expect(result?.guestUuid).toBe(guestUuid);
    });

    it('returns null when neither userId nor guestUuid is provided', async () => {
      const identity: RoomIdentity = { isAuthenticated: false };

      const result = await getRoomMembership(testDb, identity, 'room-id');

      expect(result).toBeNull();
    });
  });

  describe('editRoomMemberDisplayName', () => {
    it('updates user display name', async () => {
      const user = await createTestUser();
      const { receipt } = await createSuccessfulReceipt(user.id, [
        { interpretedText: 'Item 1', price: 10 },
      ]);
      const room = await createTestRoom(receipt.id, user.id);
      await createTestRoomMember(room.id, {
        userId: user.id,
        displayName: 'Old Name',
      });

      const identity: RoomIdentity = {
        userId: user.id,
        isAuthenticated: true,
        name: 'Test',
      };

      const result = await editRoomMemberDisplayName(
        testDb,
        identity,
        room.id,
        'New Name',
      );

      expect(result?.displayName).toBe('New Name');
    });

    it('updates guest display name', async () => {
      const user = await createTestUser();
      const { receipt } = await createSuccessfulReceipt(user.id, [
        { interpretedText: 'Item 1', price: 10 },
      ]);
      const room = await createTestRoom(receipt.id, user.id);
      const guestUuid = crypto.randomUUID();
      await createTestRoomMember(room.id, {
        guestUuid,
        displayName: 'Old Guest',
      });

      const identity: RoomIdentity = { guestUuid, isAuthenticated: false };

      const result = await editRoomMemberDisplayName(
        testDb,
        identity,
        room.id,
        'New Guest',
      );

      expect(result?.displayName).toBe('New Guest');
    });
  });

  describe('upgradeRoomMember', () => {
    it('upgrades guest member to user', async () => {
      const user = await createTestUser();
      const { receipt } = await createSuccessfulReceipt(user.id, [
        { interpretedText: 'Item 1', price: 10 },
      ]);

      const room = await createTestRoom(receipt.id, user.id);
      const guestUuid = crypto.randomUUID();
      const member = await createTestRoomMember(room.id, {
        guestUuid,
        displayName: 'Guest',
      });

      const identity: RoomIdentity = {
        userId: user.id,
        guestUuid,
        isAuthenticated: true,
        name: 'Test',
      };

      const result = await upgradeRoomMember(testDb, identity, room.id);

      expect(result?.userId).toBe(user.id);
      expect(result?.roomMemberId).toBe(member.id);
    });

    it('updates room timestamp', async () => {
      const user = await createTestUser();
      const { receipt } = await createSuccessfulReceipt(user.id, [
        { interpretedText: 'Item 1', price: 10 },
      ]);
      const seededRoom = await createTestRoom(receipt.id, user.id);
      await createTestRoomMember(seededRoom.id, {
        userId: user.id,
        displayName: 'Old Name',
      });
      const identity: RoomIdentity = {
        userId: user.id,
        isAuthenticated: true,
        name: 'Test',
      };
      const before = await testDb.query.room.findFirst({
        where: eq(room.id, seededRoom.id),
      });
      await editRoomMemberDisplayName(
        testDb,
        identity,
        seededRoom.id,
        'New Name',
      );
      const after = await testDb.query.room.findFirst({
        where: eq(room.id, seededRoom.id),
      });
      expect(before?.updatedAt).toBeDefined();
      expect(after?.updatedAt).toBeDefined();
      expect(after?.updatedAt.getTime()).toBeGreaterThan(
        before?.updatedAt?.getTime() || 0,
      );
    });
  });
  it('returns null when guestUuid is not provided', async () => {
    const user = await createTestUser();
    const { receipt } = await createSuccessfulReceipt(user.id, [
      { interpretedText: 'Item 1', price: 10 },
    ]);
    const room = await createTestRoom(receipt.id, user.id);

    const identity: RoomIdentity = {
      userId: user.id,
      isAuthenticated: true,
      name: 'Test',
    };

    const result = await upgradeRoomMember(testDb, identity, room.id);

    expect(result).toBeNull();
  });

  it('returns null when userId is not provided', async () => {
    const user = await createTestUser();
    const { receipt } = await createSuccessfulReceipt(user.id, [
      { interpretedText: 'Item 1', price: 10 },
    ]);
    const room = await createTestRoom(receipt.id, user.id);

    const identity: RoomIdentity = {
      guestUuid: crypto.randomUUID(),
      isAuthenticated: false,
    };

    const result = await upgradeRoomMember(testDb, identity, room.id);

    expect(result).toBeNull();
  });

  it('returns null when guest member does not exist', async () => {
    const user = await createTestUser();
    const { receipt } = await createSuccessfulReceipt(user.id, [
      { interpretedText: 'Item 1', price: 10 },
    ]);
    const room = await createTestRoom(receipt.id, user.id);

    const identity: RoomIdentity = {
      userId: user.id,
      guestUuid: crypto.randomUUID(),
      isAuthenticated: true,
      name: 'Test',
    };

    const result = await upgradeRoomMember(testDb, identity, room.id);

    expect(result).toBeNull();
  });
});

describe('resolveMembershipState', () => {
  it('returns user membership when exists', async () => {
    const user = await createTestUser();
    const { receipt } = await createSuccessfulReceipt(user.id, [
      { interpretedText: 'Item 1', price: 10 },
    ]);
    const room = await createTestRoom(receipt.id, user.id);
    await createTestRoomMember(room.id, {
      userId: user.id,
      displayName: 'User',
    });

    const identity: RoomIdentity = {
      userId: user.id,
      isAuthenticated: true,
      name: 'Test',
    };

    const result = await resolveMembershipState(testDb, room.id, identity);

    expect(result.membership?.userId).toBe(user.id);
    expect(result.canMerge).toBe(false);
  });

  it('returns guest membership for merge when user has guest cookie', async () => {
    const user = await createTestUser();
    const { receipt } = await createSuccessfulReceipt(user.id, [
      { interpretedText: 'Item 1', price: 10 },
    ]);
    const room = await createTestRoom(receipt.id, user.id);
    const guestUuid = crypto.randomUUID();
    const member = await createTestRoomMember(room.id, {
      guestUuid,
      displayName: 'Guest',
    });

    const identity: RoomIdentity = {
      userId: user.id,
      guestUuid,
      isAuthenticated: true,
      name: 'Test',
    };

    const result = await resolveMembershipState(testDb, room.id, identity);

    expect(result.membership?.roomMemberId).toBe(member.id);
    expect(result.canMerge).toBe(true);
  });

  it('returns null membership when no identity provided', async () => {
    const user = await createTestUser();
    const { receipt } = await createSuccessfulReceipt(user.id, [
      { interpretedText: 'Item 1', price: 10 },
    ]);
    const room = await createTestRoom(receipt.id, user.id);

    const identity: RoomIdentity = { isAuthenticated: false };

    const result = await resolveMembershipState(testDb, room.id, identity);

    expect(result.membership).toBeNull();
    expect(result.canMerge).toBe(false);
  });
});
