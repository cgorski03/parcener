import { and, eq } from "drizzle-orm";
import { db, room, roomMember } from "../db";
import { getReceiptIsValid } from "../get-receipt/get-receipt-service";
import { ROOM_CREATE_ERROR } from "../response-types";
import { RoomIdentity } from "../auth/parse-room-identity";

export type CreateRoomRequest = {
    title: string;
    receiptId: string;
    userId: string;
}

export async function CreateRoom(receiptId: string, userId: string) {
    const validResponse = await getReceiptIsValid(receiptId);
    if (!("success" in validResponse)) {
        return validResponse;
    }

    // We know the receipt is in a valid state
    // We can create the room
    try {
        const [newRoom] = await db.insert(room).values({
            receiptId,
            title: validResponse.receipt?.title ?? "Untitled Room",
            createdBy: userId
        }).returning();
        return { success: true, room: newRoom }
    } catch (error: any) {
        console.error(error);
        return ROOM_CREATE_ERROR;
    }
}
export async function GetFullRoomInfo(roomId: string) {
    return await db.query.room.findFirst({
        where: eq(room.id, roomId),
        with: {
            receipt: {
                with: {
                    items: true,
                },
            },
            members: true,
            claims: true,
        },
    });
}
export async function GetRoom(roomId: string) {
    return await db.query.room.findFirst({
        where: eq(room.id, roomId),
    })
}

async function JoinRoomGuest(roomId: string) {
    const guestUuid = crypto.randomUUID();
    const guestName = `Guest ${guestUuid.slice(0, 8)}`
    const [newRoomMember] = await db.insert(roomMember).values({
        roomId,
        guestUuid,
        displayName: guestName
    }).returning();
    return { member: newRoomMember, generatedUuid: guestUuid, isNew: true }
}

export async function JoinRoom(identity: RoomIdentity, roomId: string) {

    // Performance optimization - can skip a query by short circuting in this case
    if (!identity.guestUuid && !identity.userId) {
        return await JoinRoomGuest(roomId);
    }

    const existingRoomMembership = await db.query.roomMember.findFirst({
        where: and(
            eq(roomMember.roomId, roomId),
            identity.userId ?
                eq(roomMember.userId, identity.userId)
                : eq(roomMember.guestUuid, identity.guestUuid!)
        )
    });

    if (existingRoomMembership) {
        return { member: existingRoomMembership, isNew: false }
    }

    if (identity.isAuthenticated) {
        const [authedNewRoomMember] = await db.insert(roomMember).values({
            roomId,
            userId: identity.userId,
            displayName: identity.name
        }).returning();
        return { member: authedNewRoomMember, identity, isNew: true }
    }
    return await JoinRoomGuest(roomId);

}


export async function editRoomMemberDisplayName(identity: RoomIdentity, roomId: string, displayName: string) {

    const [updatedRoomMember] = await db.update(roomMember)
        .set({ displayName })
        .where(and(
            eq(roomMember.roomId, roomId),
            identity.userId ?
                eq(roomMember.userId, identity.userId)
                : eq(roomMember.guestUuid, identity.guestUuid!)))
        .returning();
    return updatedRoomMember;
}

