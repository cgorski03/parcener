import { describe, it, expect } from 'vitest';
import { testDb } from '@/test/setup';
import { createTestUser } from '@/test/factories/user';
import { createSuccessfulReceipt } from '@/test/factories/receipt';
import {
  createTestRoom,
  createTestRoomMember,
  createTestClaim,
} from '@/test/factories/room';
import { RoomIdentity } from '@/shared/auth/server/room-identity';
import { claimItem } from './room-claims-service';
import { eq } from 'drizzle-orm';
import { claim } from '@/shared/server/db';
import { joinRoomAction } from './room-service';

describe('room-claims-service', () => {
  describe('claimItem', () => {
    it('creates a new claim', async () => {
      const user = await createTestUser();
      const { receipt, items } = await createSuccessfulReceipt(user.id, [
        { interpretedText: 'Item 1', price: 10, quantity: 5 },
      ]);
      const room = await createTestRoom(receipt.id, user.id);
      const member = await createTestRoomMember(room.id, { userId: user.id });

      const identity: RoomIdentity = {
        userId: user.id,
        isAuthenticated: true,
        name: 'Test',
      };

      await claimItem(testDb, {
        roomId: room.id,
        roomMemberId: member.id,
        receiptItemId: items[0].id,
        identity,
        newQuantity: 2,
      });

      const claims = await testDb.query.claim.findMany({
        where: eq(claim.receiptItemId, items[0].id),
      });

      expect(claims).toHaveLength(1);
      expect(Number(claims[0].quantity)).toBe(2);
    });

    it('updates existing claim', async () => {
      const user = await createTestUser();
      const { receipt, items } = await createSuccessfulReceipt(user.id, [
        { interpretedText: 'Item 1', price: 10, quantity: 5 },
      ]);
      const room = await createTestRoom(receipt.id, user.id);
      const member = await createTestRoomMember(room.id, { userId: user.id });

      const identity: RoomIdentity = {
        userId: user.id,
        isAuthenticated: true,
        name: 'Test',
      };

      await claimItem(testDb, {
        roomId: room.id,
        roomMemberId: member.id,
        receiptItemId: items[0].id,
        identity,
        newQuantity: 2,
      });

      await claimItem(testDb, {
        roomId: room.id,
        roomMemberId: member.id,
        receiptItemId: items[0].id,
        identity,
        newQuantity: 3,
      });

      const claims = await testDb.query.claim.findMany({
        where: eq(claim.receiptItemId, items[0].id),
      });

      expect(claims).toHaveLength(1);
      expect(Number(claims[0].quantity)).toBe(3);
    });

    it('deletes claim when quantity is 0', async () => {
      const user = await createTestUser();
      const { receipt, items } = await createSuccessfulReceipt(user.id, [
        { interpretedText: 'Item 1', price: 10, quantity: 5 },
      ]);
      const room = await createTestRoom(receipt.id, user.id);
      const member = await createTestRoomMember(room.id, { userId: user.id });
      await createTestClaim(room.id, member.id, items[0].id, 2);

      const identity: RoomIdentity = {
        userId: user.id,
        isAuthenticated: true,
        name: 'Test',
      };

      await claimItem(testDb, {
        roomId: room.id,
        roomMemberId: member.id,
        receiptItemId: items[0].id,
        identity,
        newQuantity: 0,
      });

      const claims = await testDb.query.claim.findMany({
        where: eq(claim.receiptItemId, items[0].id),
      });

      expect(claims).toHaveLength(0);
    });

    it('throws error if item does not exist', async () => {
      const user = await createTestUser();
      const { receipt } = await createSuccessfulReceipt(user.id, [
        { interpretedText: 'Item 1', price: 10, quantity: 5 },
      ]);
      const room = await createTestRoom(receipt.id, user.id);
      const member = await createTestRoomMember(room.id, { userId: user.id });

      const identity: RoomIdentity = {
        userId: user.id,
        isAuthenticated: true,
        name: 'Test',
      };

      await expect(
        claimItem(testDb, {
          roomId: room.id,
          roomMemberId: member.id,
          receiptItemId: crypto.randomUUID(),
          identity,
          newQuantity: 1,
        }),
      ).rejects.toThrow('Item was not found or does not belong to this room');
    });

    it('throws error if item does not belong to room', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const { receipt: receipt1 } = await createSuccessfulReceipt(user1.id, [
        { interpretedText: 'Item 1', price: 10, quantity: 5 },
      ]);
      const { items: items2 } = await createSuccessfulReceipt(user2.id, [
        { interpretedText: 'Item 2', price: 20, quantity: 3 },
      ]);
      const room = await createTestRoom(receipt1.id, user1.id);
      const member = await createTestRoomMember(room.id, { userId: user1.id });

      const identity: RoomIdentity = {
        userId: user1.id,
        isAuthenticated: true,
        name: 'Test',
      };

      await expect(
        claimItem(testDb, {
          roomId: room.id,
          roomMemberId: member.id,
          receiptItemId: items2[0].id,
          identity,
          newQuantity: 1,
        }),
      ).rejects.toThrow('Item was not found or does not belong to this room');
    });

    it('throws error when claiming more than available quantity', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const { receipt, items } = await createSuccessfulReceipt(user1.id, [
        { interpretedText: 'Item 1', price: 10, quantity: 5 },
      ]);
      const room = await createTestRoom(receipt.id, user1.id);
      const member1 = await createTestRoomMember(room.id, { userId: user1.id });
      const member2 = await createTestRoomMember(room.id, { userId: user2.id });
      await createTestClaim(room.id, member2.id, items[0].id, 3);

      const identity: RoomIdentity = {
        userId: user1.id,
        isAuthenticated: true,
        name: 'Test',
      };

      await expect(
        claimItem(testDb, {
          roomId: room.id,
          roomMemberId: member1.id,
          receiptItemId: items[0].id,
          identity,
          newQuantity: 3,
        }),
      ).rejects.toThrow('Already claimed');
    });

    it('allows multiple members to claim from same item', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const { receipt, items } = await createSuccessfulReceipt(user1.id, [
        { interpretedText: 'Item 1', price: 10, quantity: 10 },
      ]);
      const room = await createTestRoom(receipt.id, user1.id);
      const member1 = await createTestRoomMember(room.id, { userId: user1.id });
      const member2 = await createTestRoomMember(room.id, { userId: user2.id });

      const identity1: RoomIdentity = {
        userId: user1.id,
        isAuthenticated: true,
        name: 'User 1',
      };
      const identity2: RoomIdentity = {
        userId: user2.id,
        isAuthenticated: true,
        name: 'User 2',
      };

      await claimItem(testDb, {
        roomId: room.id,
        roomMemberId: member1.id,
        receiptItemId: items[0].id,
        identity: identity1,
        newQuantity: 5,
      });

      await claimItem(testDb, {
        roomId: room.id,
        roomMemberId: member2.id,
        receiptItemId: items[0].id,
        identity: identity2,
        newQuantity: 5,
      });

      const claims = await testDb.query.claim.findMany({
        where: eq(claim.receiptItemId, items[0].id),
      });

      expect(claims).toHaveLength(2);
    });

    it('allows claiming up to available quantity', async () => {
      const user = await createTestUser();
      const { receipt, items } = await createSuccessfulReceipt(user.id, [
        { interpretedText: 'Item 1', price: 10, quantity: 5 },
      ]);
      const room = await createTestRoom(receipt.id, user.id);
      const member = await createTestRoomMember(room.id, { userId: user.id });

      const identity: RoomIdentity = {
        userId: user.id,
        isAuthenticated: true,
        name: 'Test',
      };

      await claimItem(testDb, {
        roomId: room.id,
        roomMemberId: member.id,
        receiptItemId: items[0].id,
        identity,
        newQuantity: 5,
      });

      const claims = await testDb.query.claim.findMany({
        where: eq(claim.receiptItemId, items[0].id),
      });

      expect(claims).toHaveLength(1);
      expect(Number(claims[0].quantity)).toBe(5);
    });

    it('preserves claims when guest upgrades to user', async () => {
      const user = await createTestUser();
      const { receipt, items } = await createSuccessfulReceipt(user.id, [
        { interpretedText: 'Item 1', price: 10, quantity: 10 },
      ]);
      const room = await createTestRoom(receipt.id, user.id);
      const guestUuid = crypto.randomUUID();
      const member = await createTestRoomMember(room.id, {
        guestUuid,
        displayName: 'Guest',
      });

      const identityAsGuest: RoomIdentity = {
        guestUuid,
        isAuthenticated: false,
      };

      await claimItem(testDb, {
        roomId: room.id,
        roomMemberId: member.id,
        receiptItemId: items[0].id,
        identity: identityAsGuest,
        newQuantity: 3,
      });

      const identityAsUser: RoomIdentity = {
        userId: user.id,
        guestUuid,
        isAuthenticated: true,
        name: 'Test User',
      };

      const joinResult = await joinRoomAction(testDb, {
        roomId: room.id,
        identity: identityAsUser,
      });

      const claims = await testDb.query.claim.findMany({
        where: eq(claim.receiptItemId, items[0].id),
      });

      expect(claims).toHaveLength(1);
      expect(Number(claims[0].quantity)).toBe(3);
      expect(joinResult.member.userId).toBe(user.id);
    });

    it('touches room updatedAt when claiming items', async () => {
      const user = await createTestUser();
      const { receipt, items } = await createSuccessfulReceipt(user.id, [
        { interpretedText: 'Item 1', price: 10, quantity: 5 },
      ]);
      const room = await createTestRoom(receipt.id, user.id);
      const member = await createTestRoomMember(room.id, { userId: user.id });

      const before = await testDb.query.room.findFirst({
        where: (r, { eq }) => eq(r.id, room.id),
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const identity: RoomIdentity = {
        userId: user.id,
        isAuthenticated: true,
        name: 'Test',
      };

      await claimItem(testDb, {
        roomId: room.id,
        roomMemberId: member.id,
        receiptItemId: items[0].id,
        identity,
        newQuantity: 2,
      });

      const after = await testDb.query.room.findFirst({
        where: (r, { eq }) => eq(r.id, room.id),
      });

      expect(after?.updatedAt.getTime()).toBeGreaterThan(
        before?.updatedAt?.getTime() || 0,
      );
    });
  });
});
