import { createServerFn } from "@tanstack/react-start";
import { CreateRoom, editRoomMemberDisplayName, GetFullRoomInfo, GetRoomHeader, getRoomMembership, joinRoomAction } from "./room-service";
import { getRequest } from "@tanstack/react-start/server";
import { getServerSession } from "../auth/get-server-session";
import { parseRoomIdentity } from "../auth/parse-room-identity";
import { NOT_FOUND } from "../response-types";
import { z } from 'zod';
import { ReceiptDto, receiptEntityWithReferencesToDtoHelper, RoomMemberDto } from "../dtos";
import { claimItem } from "./room-claims-service";
import { ClaimSelect, RoomSelect } from "../db";

export const createRoomRpc = createServerFn({ method: 'POST' })
    .inputValidator(z.string().uuid())
    .handler(async ({ data: roomId }) => {
        const request = getRequest();
        const session = await getServerSession(request);
        const userId = session.data?.user.id;
        if (userId == null) {
            throw new Error('Not authorized to perform this action');
        }
        return CreateRoom(roomId, userId);
    });

export type FullRoomInfo = RoomSelect & {
    receipt: ReceiptDto;
    claims: ClaimSelect[];
    members: RoomMemberDto[];
}

export const getRoomAndMembership = createServerFn({ method: 'GET' })
    .inputValidator(
        z.string().uuid()
    )
    .handler(async ({ data: roomId }) => {
        const request = getRequest();
        const ident = await parseRoomIdentity(request, roomId);
        const user = await getServerSession(request);

        const roomData = await GetFullRoomInfo(roomId);
        const userInformation = await getRoomMembership(ident, roomId);

        if (!roomData) return { room: undefined };

        const roomInfo: FullRoomInfo = {
            id: roomData.id,
            title: roomData.title,
            receiptId: roomData.receiptId,
            createdAt: roomData.createdAt,
            updatedAt: roomData.updatedAt,
            createdBy: roomData.createdBy,
            members: roomData.members,
            claims: roomData.claims,
            receipt: receiptEntityWithReferencesToDtoHelper(roomData.receipt)
        };

        // 6. Return the Data wrapper
        return {
            room: roomInfo,
            membership: userInformation,
            user: user.data?.user,
        };
    });

export const getRoomPulseRpc = createServerFn({ method: 'GET' })
    .inputValidator(z.object({
        roomId: z.string().uuid(),
        since: z.date().optional().nullable()
    }))
    .handler(async ({ data }) => {
        const { roomId, since } = data;
        const roomHeader = await GetRoomHeader(roomId);

        // Room doesn't exist
        if (!roomHeader || !roomHeader.updatedAt) return undefined;

        // 3. The Check: If 'since' exists and server time is NOT newer
        // We return early with a specific flag
        if (since && roomHeader.updatedAt <= since) {
            return {
                changed: false,
                nextCursor: roomHeader.updatedAt
            };
        }

        // Only runs if data is missing (initial load) or stale (since < updatedAt)
        const roomData = await GetFullRoomInfo(roomId);

        if (!roomData) return undefined;

        const roomInfo: FullRoomInfo = {
            id: roomData.id,
            title: roomData.title,
            receiptId: roomData.receiptId,
            createdAt: roomData.createdAt,
            updatedAt: roomData.updatedAt,
            createdBy: roomData.createdBy,
            members: roomData.members,
            claims: roomData.claims,
            receipt: receiptEntityWithReferencesToDtoHelper(roomData.receipt)
        };

        // 6. Return the Data wrapper
        return {
            changed: true,
            data: roomInfo,
            nextCursor: roomData.updatedAt
        };
    });

export const updateRoomDisplayNameRpc = createServerFn({ method: 'POST' })
    .inputValidator(z.object({
        roomId: z.string().uuid(),
        name: z.string().trim().min(1, "Name cannot be empty").max(50, "Name too long")
    }))
    .handler(async ({ data }) => {
        const { roomId, name } = data;
        const request = getRequest();
        const identity = await parseRoomIdentity(request, roomId);
        // Check Room Exists
        if (!identity.guestUuid && !identity.userId) {
            // TODO 
            return NOT_FOUND
        }
        return await editRoomMemberDisplayName(identity, roomId, name);
    });

export const claimItemRpc = createServerFn({ method: 'POST' })
    .inputValidator(z.object({
        roomId: z.string().uuid(),
        receiptItemId: z.string().uuid(),
        quantity: z.number().min(0),
    }))
    .handler(async ({ data }) => {
        const { roomId, receiptItemId, quantity } = data;
        console.log("someone is trying to claim");
        const request = getRequest();
        const identity = await parseRoomIdentity(request, roomId);
        const member = await getRoomMembership(identity, roomId);
        if (!member) {
            console.error('user is not a member of this room');
            return null;
        }
        if (!identity.guestUuid && !identity.userId) {
            // TODO 
            return NOT_FOUND
        }
        return await claimItem({ roomId, identity, receiptItemId, roomMemberId: member.id, newQuantity: quantity });
    });

export const joinRoomRpc = createServerFn({ method: 'POST' })
    .inputValidator(z.object({
        roomId: z.string().uuid(),
        displayName: z.string().nullable(),
    }))
    .handler(async ({ data }) => {
        const { roomId, displayName } = data;
        const request = getRequest();
        const identity = await parseRoomIdentity(request, roomId);
        return await joinRoomAction({ roomId, identity, displayName: displayName ?? undefined });
    });


