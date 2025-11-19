import { createServerFn } from "@tanstack/react-start";
import { CreateRoom, JoinRoom } from "./room-service";
import { getRequest } from "@tanstack/react-start/server";
import { getServerSession } from "../auth/get-server-session";
import { parseRoomIdentity } from "../auth/parse-room-identity";

export const createRoomRpc = createServerFn({ method: 'POST' })
    .inputValidator((createRoomRequest: { title: string; receiptId: string }) => createRoomRequest)
    .handler(async ({ data: createRoomRequest }) => {
        const request = getRequest();
        const session = await getServerSession(request);
        const userId = session.data?.user.id;
        if (userId == null) {
            throw new Error('Not authorized to perform this action');
        }
        return CreateRoom({ ...createRoomRequest, userId });
    });

export const joinRoomRpc = createServerFn({ method: 'POST' })
    .inputValidator((roomId: string) => roomId)
    .handler(async ({ data: roomId }) => {
        const request = getRequest();
        const identity = await parseRoomIdentity(request, roomId);
        return await JoinRoom(identity, roomId);
    });
