import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import {
  GetFullRoomInfo,
  GetRoomHeader,
  createRoom,
  joinRoomAction,
  lockRoomId,
  renameRoom,
  unlockRoomId,
  updateRoomPaymentInformation,
} from './room-service';
import { claimItem } from './room-claims-service';
import {
  editRoomMemberDisplayName,
  upgradeRoomMember,
} from './room-member-service';
import {
  addRoomPaymentMethod,
  claimItemRequestSchema,
  createRoomRequestSchema,
  getRoomPulseSchema,
  joinRoomRequestSchema,
  renameRoomRequestSchema,
  roomObjSchema,
  updateDisplayNameRoomRequestSchema,
} from '@/shared/dto/dtos';
import { nameTransaction } from '@/shared/observability/server/sentry-middleware';
import { mapDbRoomToDto } from '@/shared/dto/mappers';
import { logger } from '@/shared/observability/logger';
import { SENTRY_EVENTS } from '@/shared/observability/sentry-events';
import { protectedFunctionMiddleware } from '@/shared/auth/server/middleware';
import { getServerSession } from '@/shared/auth/server/get-server-session';
import {
  parseRoomIdentity,
  roomContextMiddleware,
} from '@/shared/auth/server/room-identity';
import { throwRpcError } from '@/shared/server/utils/rpc-errors';

export const getRoomAndMembership = createServerFn({ method: 'GET' })
  .middleware([nameTransaction('getRoomAndMembership'), roomContextMiddleware])
  .inputValidator(roomObjSchema)
  .handler(async ({ data: { roomId }, context }) => {
    try {
      const roomData = await GetFullRoomInfo(context.db, roomId);
      const roomInfo = mapDbRoomToDto(roomData);

      if (!roomInfo) return null;
      const { membership, canMergeGuestToMember } = context.room;

      return {
        room: roomInfo,
        membership,
        user: context.user,
        canMergeGuestToMember,
      };
    } catch (error) {
      logger.error(error, SENTRY_EVENTS.ROOM.GET_DETAILS, { roomId });
      throwRpcError('Failed to load room details');
    }
  });

export const getRoomPulseRpc = createServerFn({ method: 'GET' })
  .middleware([nameTransaction('getRoomPulseRpc')])
  .inputValidator(getRoomPulseSchema)
  .handler(async ({ data, context }) => {
    try {
      const { roomId, since } = data;
      const roomHeader = await GetRoomHeader(context.db, roomId);

      if (since && roomHeader.updatedAt <= since) {
        return { changed: false, nextCursor: roomHeader.updatedAt };
      }

      // 2. Expensive Fetch
      const roomData = await GetFullRoomInfo(context.db, roomId);
      const roomInfo = mapDbRoomToDto(roomData);

      if (!roomInfo || !roomData) return null;

      return {
        changed: true,
        data: roomInfo,
        nextCursor: roomData.updatedAt,
      };
    } catch (error) {
      logger.error(error, SENTRY_EVENTS.ROOM.GET_PULSE, {
        roomId: data.roomId,
      });
      throwRpcError('Failed to load room updates');
    }
  });

export const createRoomRpc = createServerFn({ method: 'POST' })
  .middleware([nameTransaction('createRoomRpc'), protectedFunctionMiddleware])
  .inputValidator(createRoomRequestSchema)
  .handler(async ({ data: request, context }) => {
    try {
      return await createRoom(
        context.db,
        request.receiptId,
        request.paymentMethodId,
        context.user.id,
      );
    } catch (error) {
      logger.error(error, SENTRY_EVENTS.ROOM.CREATE, {
        userId: context.user.id,
      });
      throwRpcError('Failed to create room');
    }
  });

export const lockRoom = createServerFn({ method: 'POST' })
  .middleware([nameTransaction('lockRoom'), protectedFunctionMiddleware])
  .inputValidator(roomObjSchema)
  .handler(async ({ data: { roomId }, context }) => {
    try {
      return await lockRoomId(context.db, roomId, context.user.id);
    } catch (error) {
      logger.error(error, SENTRY_EVENTS.ROOM.LOCK, {
        userId: context.user.id,
        roomId: roomId,
      });
      throwRpcError('Failed to lock room');
    }
  });

export const unlockRoom = createServerFn({ method: 'POST' })
  .middleware([nameTransaction('unlockRoom'), protectedFunctionMiddleware])
  .inputValidator(roomObjSchema)
  .handler(async ({ data: { roomId }, context }) => {
    try {
      return await unlockRoomId(context.db, roomId, context.user.id);
    } catch (error) {
      logger.error(error, SENTRY_EVENTS.ROOM.UNLOCK, {
        userId: context.user.id,
        roomId: roomId,
      });
      throwRpcError('Failed to unlock room');
    }
  });

export const updateRoomHostPaymentMethod = createServerFn({ method: 'POST' })
  .middleware([
    nameTransaction('updateRoomHostPaymentMethod'),
    protectedFunctionMiddleware,
  ])
  .inputValidator(addRoomPaymentMethod)
  .handler(async ({ data: request, context }) => {
    try {
      return await updateRoomPaymentInformation(
        context.db,
        request.roomId,
        request.paymentMethodId,
        context.user.id,
      );
    } catch (error) {
      logger.error(error, SENTRY_EVENTS.ROOM.UPDATE_PAYMENT_METHOD_ID, {
        userId: context.user.id,
        roomId: request.roomId,
        paymentMethodId: request.paymentMethodId,
      });
      throwRpcError('Failed to update payment method');
    }
  });

export const renameRoomRpc = createServerFn({ method: 'POST' })
  .middleware([nameTransaction('renameRoom'), protectedFunctionMiddleware])
  .inputValidator(renameRoomRequestSchema)
  .handler(async ({ data: request, context }) => {
    try {
      return await renameRoom({
        db: context.db,
        roomId: request.roomId,
        userId: context.user.id,
        newTitle: request.newTitle,
      });
    } catch (error) {
      logger.error(error, SENTRY_EVENTS.ROOM.RENAME, {
        userId: context.user.id,
        roomId: request.roomId,
        newTitle: request.newTitle,
      });
      throwRpcError('Failed to rename room');
    }
  });

export const upgradeGuestToUser = createServerFn({ method: 'POST' })
  .middleware([nameTransaction('upgradeGuestToUser'), roomContextMiddleware])
  .inputValidator(roomObjSchema)
  .handler(async ({ data: { roomId }, context }) => {
    const { identity, canMergeGuestToMember } = context.room;
    try {
      if (!canMergeGuestToMember) {
        logger.info(
          'Upgrade blocked: Merge conditions not met',
          SENTRY_EVENTS.ROOM.UPGRADE_MEMBER,
          {
            roomId,
            userId: identity.userId,
            hasGuestUuid: !!identity.guestUuid,
          },
        );
        return null;
      }

      const result = await upgradeRoomMember(context.db, identity, roomId);

      // 2. State Anomaly (The pre-check passed, but the DB update changed nothing)
      // This suggests a race condition or a missing record.
      if (!result) {
        logger.error(
          new Error('Upgrade failed: Record not found during merge'),
          SENTRY_EVENTS.ROOM.UPGRADE_MEMBER,
          {
            roomId,
            userId: identity.userId,
            guestUuid: identity.guestUuid,
          },
        );
        return null;
      }

      return result;
    } catch (error) {
      logger.error(error, SENTRY_EVENTS.ROOM.UPGRADE_MEMBER, {
        roomId,
        userId: identity.userId,
        guestUuid: identity.guestUuid,
      });
      throwRpcError('Failed to upgrade member');
    }
  });

export const updateRoomDisplayNameRpc = createServerFn({ method: 'POST' })
  .middleware([nameTransaction('updateRoomDisplayNameRpc')])
  .inputValidator(updateDisplayNameRoomRequestSchema)
  .handler(async ({ data, context }) => {
    try {
      const { roomId, displayName } = data;
      const request = getRequest();
      const session = await getServerSession(request, context.auth);
      const identity = parseRoomIdentity(request, roomId, session?.user);

      if (!identity.guestUuid && !identity.userId) {
        return null;
      }
      return await editRoomMemberDisplayName(
        context.db,
        identity,
        roomId,
        displayName,
      );
    } catch (error) {
      logger.error(error, SENTRY_EVENTS.ROOM.UPDATE_NAME, {
        roomId: data.roomId,
      });
      throwRpcError('Failed to update display name');
    }
  });

export const joinRoomRpc = createServerFn({ method: 'POST' })
  .middleware([nameTransaction('joinRoomRpc'), roomContextMiddleware])
  .inputValidator(joinRoomRequestSchema)
  .handler(async ({ data, context }) => {
    try {
      const { roomId, displayName } = data;
      const { identity } = context.room;
      return await joinRoomAction(context.db, {
        roomId,
        identity,
        displayName: displayName ?? undefined,
      });
    } catch (error) {
      logger.error(error, SENTRY_EVENTS.ROOM.JOIN, { roomId: data.roomId });
      throwRpcError('Failed to join room');
    }
  });

export const claimItemRpc = createServerFn({ method: 'POST' })
  .middleware([nameTransaction('claimItemRpc'), roomContextMiddleware])
  .inputValidator(claimItemRequestSchema)
  .handler(async ({ data, context }) => {
    try {
      const { roomId, receiptItemId, quantity } = data;
      const { identity, membership } = context.room;

      if (!membership) return null;

      return await claimItem(context.db, {
        roomId,
        identity,
        receiptItemId,
        roomMemberId: membership.roomMemberId,
        newQuantity: quantity,
      });
    } catch (error) {
      logger.error(error, SENTRY_EVENTS.ROOM.CLAIM_ITEM, {
        roomId: data.roomId,
        itemId: data.receiptItemId,
      });
      throwRpcError('Failed to claim item');
    }
  });
