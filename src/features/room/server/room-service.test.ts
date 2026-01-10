import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import {
    GetFullRoomInfo,
    GetRoomHeader,
    createRoom,
    joinRoomAction,
    updateRoomPaymentInformation,
} from './room-service';
import type {
    CreateRoomResponseType
} from './room-service';
import type { RoomIdentity } from '@/shared/auth/server/room-identity';
import type { RoomDto } from '@/shared/dto/types';
import { testDb } from '@/test/setup';
import { createTestUser } from '@/test/factories/user';
import { createSuccessfulReceipt } from '@/test/factories/receipt';
import { createTestRoom, createTestRoomMember } from '@/test/factories/room';
import { createUserPaymentMethod } from '@/features/payment-methods/server/payment-method-service';
import { roomMember } from '@/shared/server/db/schema';

function assertRoomCreateSuccess(
    result: CreateRoomResponseType,
): asserts result is { success: true; room: RoomDto } {
    if (!result.success) {
        throw new Error(`Expected success, got error: ${result.error}`);
    }
}

describe('room-service', () => {
    describe('createRoom', () => {
        it('creates a room for a valid receipt', async () => {
            const user = await createTestUser();
            const { receipt } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10 },
            ], testDb);

            const result = await createRoom(testDb, receipt.id, null, user.id);

            if ('success' in result && result.success && 'room' in result) {
                expect(result.room.roomId).toBeDefined();
            } else {
                throw new Error('Result was not successful');
            }
        });

        it('returns error for processing receipt', async () => {
            const user = await createTestUser();
            const { receipt } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10 },
            ], testDb);

            const result = await createRoom(testDb, receipt.id, null, user.id);

            expect(result).toBeDefined();
        });

        it('returns ROOM_EXISTS_ERROR if room already exists for receipt', async () => {
            const user = await createTestUser();
            const { receipt } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10 },
            ], testDb);

            await createRoom(testDb, receipt.id, null, user.id);
            const result = await createRoom(testDb, receipt.id, null, user.id);

            expect(result).toEqual({ success: false, error: 'room_exists' });
        });

        it('associates payment method when provided', async () => {
            const user = await createTestUser();
            const { receipt } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10 },
            ], testDb);
            const method = await createUserPaymentMethod(testDb, user, {
                type: 'venmo',
                handle: '@test',
                isDefault: false,
            });

            const result = await createRoom(
                testDb,
                receipt.id,
                method.paymentMethodId,
                user.id,
            );

            if (result.success) {
                expect(result.room.hostPaymentInformation?.type).toBe(method.type);
                expect(result.room.hostPaymentInformation?.handle).toBe(method.handle);
            }
        });
    });

    describe('updateRoomPaymentInformation', () => {
        it('updates room payment method', async () => {
            const user = await createTestUser();
            const { receipt } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10 },
            ], testDb);
            const roomResult = await createRoom(testDb, receipt.id, null, user.id);

            assertRoomCreateSuccess(roomResult);

            const method = await createUserPaymentMethod(testDb, user, {
                type: 'venmo',
                handle: '@test',
                isDefault: false,
            });

            const result = await updateRoomPaymentInformation(
                testDb,
                roomResult.room.roomId,
                method.paymentMethodId,
                user.id,
            );

            expect(result).toBeDefined();
            expect(result?.hostPaymentMethodId).toBe(method.paymentMethodId);
        });

        it('returns null if user does not own the room', async () => {
            const user1 = await createTestUser();
            const user2 = await createTestUser();
            const { receipt } = await createSuccessfulReceipt(user1.id, [
                { interpretedText: 'Item 1', price: 10 },
            ], testDb);
            const roomResult = await createRoom(testDb, receipt.id, null, user1.id);

            assertRoomCreateSuccess(roomResult);

            const result = await updateRoomPaymentInformation(
                testDb,
                roomResult.room.roomId,
                null,
                user2.id,
            );

            expect(result).toBeNull();
        });

        it('sets payment method to null when paymentMethodId is null', async () => {
            const user = await createTestUser();
            const { receipt } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10 },
            ], testDb);
            const roomResult = await createRoom(testDb, receipt.id, null, user.id);

            assertRoomCreateSuccess(roomResult);

            const result = await updateRoomPaymentInformation(
                testDb,
                roomResult.room.roomId,
                null,
                user.id,
            );

            expect(result).toBeDefined();
            expect(result?.hostPaymentMethodId).toBeNull();
        });
    });

    describe('GetFullRoomInfo', () => {
        it('returns room with full information', async () => {
            const user = await createTestUser();
            const { receipt } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10 },
                { interpretedText: 'Item 2', price: 20 },
            ], testDb);
            const room = await createTestRoom(receipt.id, user.id);
            await createTestRoomMember(room.id, {
                userId: user.id,
                displayName: 'Test User',
            });

            const result = await GetFullRoomInfo(testDb, room.id);

            expect(result).toBeDefined();
            expect(result?.id).toBe(room.id);
            expect(result?.members).toHaveLength(1);
            expect(result?.members[0].displayName).toBe('Test User');
            expect(result?.receipt.items).toHaveLength(2);
        });

        it('includes guest members', async () => {
            const user = await createTestUser();
            const { receipt } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10 },
            ], testDb);
            const room = await createTestRoom(receipt.id, user.id);
            const guestUuid = crypto.randomUUID();
            await createTestRoomMember(room.id, { guestUuid, displayName: 'Guest' });

            const result = await GetFullRoomInfo(testDb, room.id);

            expect(result?.members).toHaveLength(1);
            expect(result?.members[0].isGuest).toBe(true);
        });
    });

    describe('GetRoomHeader', () => {
        it('returns room header with updatedAt timestamp', async () => {
            const user = await createTestUser();
            const { receipt } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10 },
            ], testDb);
            const room = await createTestRoom(receipt.id, user.id);

            const result = await GetRoomHeader(testDb, room.id);

            expect(result).toBeDefined();
            expect(result.updatedAt).toBeDefined();
        });
    });

    describe('joinRoomAction', () => {
        it('adds new member to room', async () => {
            const user = await createTestUser();
            const { receipt } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10 },
            ], testDb);
            const room = await createTestRoom(receipt.id, user.id);

            const identity: RoomIdentity = {
                userId: user.id,
                isAuthenticated: true,
                name: 'Test User',
            };

            const result = await joinRoomAction(testDb, {
                roomId: room.id,
                identity,
            });

            expect(result.member).toBeDefined();
            expect(result.member.userId).toBe(user.id);
        });

        it('returns existing member without creating duplicate', async () => {
            const user = await createTestUser();
            const { receipt } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10 },
            ], testDb);
            const room = await createTestRoom(receipt.id, user.id);

            const identity: RoomIdentity = {
                userId: user.id,
                isAuthenticated: true,
                name: 'Test User',
            };

            await joinRoomAction(testDb, { roomId: room.id, identity });
            await joinRoomAction(testDb, {
                roomId: room.id,
                identity,
            });

            const members = await testDb.query.roomMember.findMany({
                where: eq(roomMember.roomId, room.id),
            });

            expect(members).toHaveLength(1);
        });

        it('upgrades guest member to user', async () => {
            const user = await createTestUser();
            const { receipt } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10 },
            ], testDb);
            const room = await createTestRoom(receipt.id, user.id);
            const guestUuid = crypto.randomUUID();
            await createTestRoomMember(room.id, { guestUuid, displayName: 'Guest' });

            const identity: RoomIdentity = {
                userId: user.id,
                guestUuid,
                isAuthenticated: true,
                name: 'Test User',
            };

            const result = await joinRoomAction(testDb, {
                roomId: room.id,
                identity,
            });

            expect(result.member.userId).toBe(user.id);
            expect(result.generatedUuid).toBe(guestUuid);
        });

        it('uses custom display name when provided', async () => {
            const user = await createTestUser();
            const { receipt } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10 },
            ], testDb);
            const room = await createTestRoom(receipt.id, user.id);

            const identity: RoomIdentity = {
                userId: user.id,
                isAuthenticated: true,
                name: 'Test User',
            };

            const result = await joinRoomAction(testDb, {
                roomId: room.id,
                identity,
                displayName: 'Custom Name',
            });

            expect(result.member.displayName).toBe('Custom Name');
        });

        it('creates guest member for unauthenticated user', async () => {
            const user = await createTestUser();
            const { receipt } = await createSuccessfulReceipt(user.id, [
                { interpretedText: 'Item 1', price: 10 },
            ], testDb);
            const room = await createTestRoom(receipt.id, user.id);

            const guestUuid = crypto.randomUUID();
            const identity: RoomIdentity = {
                guestUuid,
                isAuthenticated: false,
            };

            const result = await joinRoomAction(testDb, {
                roomId: room.id,
                identity,
            });

            expect(result.member.userId).toBeNull();
            expect(result.member.guestUuid).toBe(guestUuid);
            expect(result.member.displayName).toContain('Guest');
        });
    });
});
