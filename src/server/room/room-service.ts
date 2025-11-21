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


export async function getRoomMembership(identity: RoomIdentity, roomId: string) {
    if (!identity.guestUuid && !identity.userId) {
        return null;
    }
    const whereClause = identity.userId
        ? eq(roomMember.userId, identity.userId)
        : eq(roomMember.guestUuid, identity.guestUuid!);

    const member = await db.query.roomMember.findFirst({
        where: and(
            eq(roomMember.roomId, roomId),
            whereClause
        )
    });

    return member || null;
}

export async function GetRoomHeader(roomId: string) {
    const [header] = await db
        .select({ updatedAt: room.updatedAt })
        .from(room)
        .where(eq(room.id, roomId));
    return header;
}

export async function joinRoomAction(input: {
    roomId: string,
    identity: RoomIdentity,
    displayName?: string
}) {
    const { roomId, identity, displayName } = input;

    // SCENARIO A: They are ALREADY a member (Double check)
    const existing = await getRoomMembership(identity, roomId);

    // SCENARIO B: The "Upgrade" Case (Guest -> User)
    if (existing && existing.userId === null && identity.userId) {
        return await db.transaction(async (tx) => {
            const [upgraded] = await tx.update(roomMember).set({
                userId: identity.userId,
                displayName: displayName || identity.name || existing.displayName, // Prefer new name, then auth name, then old guest name
            }).where(
                eq(roomMember.id, existing.id)
            ).returning();

            // Touch room
            await tx.update(room).set({ updatedAt: new Date() }).where(eq(room.id, roomId));

            return { member: upgraded, generatedUuid: existing.guestUuid };
        });
    }

    // If they exist and no upgrade needed, just return
    if (existing) {
        return { member: existing, generatedUuid: existing.guestUuid };
    }

    // SCENARIO C: New Member (User or Guest)
    return await db.transaction(async (tx) => {
        const newGuestUuid = identity.guestUuid || crypto.randomUUID();
        const finalName = displayName || identity.name || `Guest ${newGuestUuid.slice(0, 4)}`;

        const [newMember] = await tx.insert(roomMember).values({
            roomId,
            userId: identity.userId || null, // Null if guest
            guestUuid: newGuestUuid,         // Always generate one for the cookie
            displayName: finalName
        }).returning();

        // Touch room
        await tx.update(room).set({ updatedAt: new Date() }).where(eq(room.id, roomId));

        return { member: newMember, generatedUuid: newGuestUuid };
    });
}


export async function editRoomMemberDisplayName(identity: RoomIdentity, roomId: string, displayName: string) {

    return await db.transaction(async (tx) => {

        const [updatedRoomMember] = await tx.update(roomMember)
            .set({ displayName })
            .where(and(
                eq(roomMember.roomId, roomId),
                identity.userId ?
                    eq(roomMember.userId, identity.userId)
                    : eq(roomMember.guestUuid, identity.guestUuid!)))
            .returning();

        await tx.update(room)
            .set({ updatedAt: new Date() })
            .where(eq(room.id, roomId));

        return updatedRoomMember;
    })
}

