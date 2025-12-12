import { createServerFn } from '@tanstack/react-start'
import {
    CreateRoom,
    editRoomMemberDisplayName,
    GetFullRoomInfo,
    GetRoomHeader,
    getRoomMembership,
    joinRoomAction,
} from './room-service'
import { getRequest } from '@tanstack/react-start/server'
import { getServerSession } from '../auth/get-server-session'
import { parseRoomIdentity } from '../auth/parse-room-identity'
import {
    claimItemRequestSchema,
    FullRoomInfoDto,
    getRoomPulseSchema,
    joinRoomRequestSchema,
    receiptWithItemsToDto,
    receiptIdSchema,
    roomIdSchema,
    updateDisplayNameRoomRequestSchema,
} from '../dtos'
import { claimItem } from './room-claims-service'

export const createRoomRpc = createServerFn({ method: 'POST' })
    .inputValidator(receiptIdSchema)
    .handler(async ({ data: receiptId, context }) => {
        const request = getRequest()
        const session = await getServerSession(request, context.auth)
        const userId = session?.user.id
        if (userId == null) {
            throw new Error('Not authorized to perform this action')
        }
        return CreateRoom(context.db, receiptId, userId)
    })

export const getRoomAndMembership = createServerFn({ method: 'GET' })
    .inputValidator(roomIdSchema)
    .handler(async ({ data: roomId, context }) => {
        const request = getRequest()
        const session = await getServerSession(request, context.auth)
        const ident = await parseRoomIdentity(request, roomId, session?.user)

        const roomData = await GetFullRoomInfo(context.db, roomId)
        const userInformation = await getRoomMembership(context.db, ident, roomId)

        if (!roomData) return null;
        const receipt = receiptWithItemsToDto(roomData.receipt);
        if (!receipt) return null;

        const roomInfo: FullRoomInfoDto = {
            roomId: roomData.id,
            title: roomData.title,
            receiptId: roomData.receiptId,
            createdAt: roomData.createdAt,
            updatedAt: roomData.updatedAt,
            createdBy: roomData.createdBy,
            members: roomData.members,
            claims: roomData.claims,
            receipt,
        }

        return {
            room: roomInfo,
            membership: userInformation,
            user: session?.user,
        }
    })

export const getRoomPulseRpc = createServerFn({ method: 'GET' })
    .inputValidator(getRoomPulseSchema)
    .handler(async ({ data, context }) => {
        const { roomId, since } = data
        const roomHeader = await GetRoomHeader(context.db, roomId)

        // Room doesn't exist
        if (!roomHeader || !roomHeader.updatedAt) return undefined

        // 3. The Check: If 'since' exists and server time is NOT newer
        // We return early with a specific flag
        if (since && roomHeader.updatedAt <= since) {
            return {
                changed: false,
                nextCursor: roomHeader.updatedAt,
            }
        }

        // Only runs if data is missing (initial load) or stale (since < updatedAt)
        const roomData = await GetFullRoomInfo(context.db, roomId)

        if (!roomData) return null;
        const receipt = receiptWithItemsToDto(roomData.receipt);
        if (!receipt) return null;

        const roomInfo: FullRoomInfoDto = {
            roomId: roomData.id,
            title: roomData.title,
            receiptId: roomData.receiptId,
            createdAt: roomData.createdAt,
            updatedAt: roomData.updatedAt,
            createdBy: roomData.createdBy,
            members: roomData.members,
            claims: roomData.claims,
            receipt,
        }

        // 6. Return the Data wrapper
        return {
            changed: true,
            data: roomInfo,
            nextCursor: roomData.updatedAt,
        }
    })

export const updateRoomDisplayNameRpc = createServerFn({ method: 'POST' })
    .inputValidator(updateDisplayNameRoomRequestSchema)
    .handler(async ({ data, context }) => {
        const { roomId, displayName } = data
        const request = getRequest()
        const session = await getServerSession(request, context.auth)
        const identity = await parseRoomIdentity(request, roomId, session?.user)

        if (!identity.guestUuid && !identity.userId) {
            return null
        }
        const updatedMember = await editRoomMemberDisplayName(context.db, identity, roomId, displayName);
        return {
            roomMemberId: updatedMember.id,
            roomId: updatedMember.roomId,
            userId: updatedMember.userId,
            guestUuid: updatedMember.guestUuid,
            displayName: updatedMember.displayName,
            joinedAt: updatedMember.joinedAt,
        }


    })

export const claimItemRpc = createServerFn({ method: 'POST' })
    .inputValidator(claimItemRequestSchema)
    .handler(async ({ data, context }) => {
        const { roomId, receiptItemId, quantity } = data
        const request = getRequest()
        const session = await getServerSession(request, context.auth)
        const identity = await parseRoomIdentity(request, roomId, session?.user)
        if (!identity.guestUuid && !identity.userId) {
            return null
        }
        const member = await getRoomMembership(context.db, identity, roomId)
        if (!member) {
            console.error('user is not a member of this room')
            return null
        }
        return await claimItem(context.db, {
            roomId,
            identity,
            receiptItemId,
            roomMemberId: member.roomMemberId,
            newQuantity: quantity,
        })
    })

export const joinRoomRpc = createServerFn({ method: 'POST' })
    .inputValidator(joinRoomRequestSchema)
    .handler(async ({ data, context }) => {
        const { roomId, displayName } = data
        const request = getRequest()
        const session = await getServerSession(request, context.auth)
        const identity = await parseRoomIdentity(request, roomId, session?.user)
        return await joinRoomAction(context.db, {
            roomId,
            identity,
            displayName: displayName ?? undefined,
        })
    })
