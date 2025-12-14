import { and, eq } from 'drizzle-orm'
import { DbTxType, DbType, room, roomMember } from '../db'
import { getReceiptIsValid } from '../get-receipt/get-receipt-service'
import { ROOM_CREATE_ERROR, ROOM_EXISTS_ERROR } from '../response-types'
import { RoomIdentity } from '../auth/parse-room-identity'
import { RoomMemberDto, RoomMembership } from '../dtos'

export type CreateRoomRequest = {
    title: string
    receiptId: string
    userId: string
}

export async function CreateRoom(
    db: DbType,
    receiptId: string,
    userId: string,
) {
    const validResponse = await getReceiptIsValid(db, receiptId, userId)
    if (!('success' in validResponse)) {
        return validResponse
    }

    // DB would prevent an existing room, but checking anyway 
    const existingRoom = await GetRoomByReceiptId(db, receiptId);
    if (existingRoom) {
        return ROOM_EXISTS_ERROR;
    }

    // We know the receipt is in a valid state
    // We can create the room
    try {
        const [newRoom] = await db
            .insert(room)
            .values({
                receiptId,
                title: validResponse.receipt?.title ?? 'Untitled Room',
                createdBy: userId,
            })
            .returning();

        return { success: true, room: newRoom }
    } catch (error: any) {
        console.error(error)
        return ROOM_CREATE_ERROR
    }
}

export async function GetFullRoomInfo(db: DbType, roomId: string) {
    const result = await db.query.room.findFirst({
        where: eq(room.id, roomId),
        with: {
            receipt: {
                with: {
                    items: true,
                },
            },
            members: {
                with: {
                    user: true,
                },
            },
            claims: true,
        },
    });
    if (result == null) return;
    const processedMembers: RoomMemberDto[] = result?.members.map((m) => ({
        roomMemberId: m.id,
        displayName: m.displayName,
        avatarUrl: m.user?.image ?? null,
        isGuest: !m.userId,
    }));
    return { ...result, members: processedMembers }
}

export async function getRoomMembership(
    db: DbType,
    identity: RoomIdentity,
    roomId: string,
): Promise<RoomMembership | null> {
    if (!identity.guestUuid && !identity.userId) {
        return null
    }
    const whereClause = identity.userId
        ? eq(roomMember.userId, identity.userId)
        : eq(roomMember.guestUuid, identity.guestUuid!)

    const member = await db.query.roomMember.findFirst({
        where: and(eq(roomMember.roomId, roomId), whereClause),
    })
    if (!member) return null;
    const { id, ...rest } = member;
    return { roomMemberId: id, ...rest }
}

export async function GetRoomHeader(db: DbType, roomId: string) {
    const [header] = await db
        .select({ updatedAt: room.updatedAt })
        .from(room)
        .where(eq(room.id, roomId));
    return header
}

async function GetRoomByReceiptId(db: DbType, receiptId: string) {
    const roomEntity = await db.query.room.findFirst({
        where: eq(room.receiptId, receiptId)
    });
    return roomEntity
}

export async function joinRoomAction(
    db: DbType,
    input: {
        roomId: string
        identity: RoomIdentity
        displayName?: string
    },
) {
    const { roomId, identity, displayName } = input

    // Get any existing membership
    const existing = await getRoomMembership(db, identity, roomId)

    //  The "Upgrade" Case (Guest -> User)
    if (existing && existing.userId === null && identity.userId) {
        return await db.transaction(async (tx) => {
            const [upgraded] = await tx
                .update(roomMember)
                .set({
                    userId: identity.userId,
                    displayName: displayName || identity.name || existing.displayName, // Prefer new name, then auth name, then old guest name
                })
                .where(eq(roomMember.id, existing.roomMemberId))
                .returning()

            // Touch room
            await touchRoomId(tx, roomId);
            return { member: upgraded, generatedUuid: existing.guestUuid }
        })
    }

    // If they exist and no upgrade needed, just return
    if (existing) {
        return { member: existing, generatedUuid: existing.guestUuid }
    }

    // SCENARIO C: New Member (User or Guest)
    return await db.transaction(async (tx) => {
        const newGuestUuid = identity.isAuthenticated
            ? null
            : identity.guestUuid || crypto.randomUUID()
        const finalName =
            displayName ||
            identity.name ||
            `Guest ${newGuestUuid && newGuestUuid.slice(0, 4)}`

        const [newMember] = await tx
            .insert(roomMember)
            .values({
                roomId,
                userId: identity.userId || null,
                guestUuid: newGuestUuid,
                displayName: finalName,
            })
            .returning()

        await touchRoomId(tx, roomId);

        return { member: newMember, generatedUuid: newGuestUuid }
    })
}

export async function editRoomMemberDisplayName(
    db: DbType,
    identity: RoomIdentity,
    roomId: string,
    displayName: string,
) {
    return await db.transaction(async (tx) => {
        const [updatedRoomMember] = await tx
            .update(roomMember)
            .set({ displayName })
            .where(
                and(
                    eq(roomMember.roomId, roomId),
                    identity.userId
                        ? eq(roomMember.userId, identity.userId)
                        : eq(roomMember.guestUuid, identity.guestUuid!),
                ),
            )
            .returning()

        await touchRoomId(tx, roomId);
        return updatedRoomMember
    })
}

// Helper: Blindly try to touch the room. 
// If the receipt has not been turned into a room yet, this affects 0 rows and does nothing.
export async function touchRoomId(db: DbTxType | DbType, roomId: string) {
    await db
        .update(room)
        .set({ updatedAt: new Date() })
        .where(eq(room.id, roomId));
}

export async function touchRoomFromReceipt(db: DbTxType | DbType, receiptId: string) {
    await db
        .update(room)
        .set({ updatedAt: new Date() })
        .where(eq(room.receiptId, receiptId));
}
