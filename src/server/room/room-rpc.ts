import { createServerFn } from "@tanstack/react-start";
import { CreateRoom, editRoomMemberDisplayName, GetFullRoomInfo, GetRoom, JoinRoom } from "./room-service";
import { getRequest } from "@tanstack/react-start/server";
import { getServerSession } from "../auth/get-server-session";
import { parseRoomIdentity } from "../auth/parse-room-identity";
import { NOT_FOUND } from "../response-types";
import { z } from 'zod';
import { receiptEntityWithReferencesToDtoHelper } from "../dtos";

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

export const getAllRoomInfo = createServerFn({ method: 'GET' })
    .inputValidator(z.string().uuid())
    .handler(async ({ data: roomId }) => {
        const roomData = await GetFullRoomInfo(roomId);
        if (!roomData) return undefined;

        return {
            id: roomData.id,
            title: roomData.title,
            receiptId: roomData.receiptId,
            createdAt: roomData.createdAt,
            createdBy: roomData.createdBy,
            members: roomData.members,
            claims: roomData.claims,
            receipt: receiptEntityWithReferencesToDtoHelper(roomData.receipt)
        };
    });

export const updateRoomDisplayName = createServerFn({ method: 'POST' })
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
export const joinRoomRpc = createServerFn({ method: 'POST' })
    .inputValidator((roomId: string) => roomId)
    .handler(async ({ data: roomId }) => {
        const request = getRequest();
        const identity = await parseRoomIdentity(request, roomId);
        // Check Room Exists
        const roomExists = await GetRoom(roomId);
        if (!roomExists) {
            return NOT_FOUND;
        }
        return await JoinRoom(identity, roomId);
    });


