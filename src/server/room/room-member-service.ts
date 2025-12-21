import { and, eq } from "drizzle-orm";
import { DbType, roomMember } from "../db";
import { RoomMembership } from "../dtos";
import { touchRoomId } from "./room-service";
import { RoomIdentity } from "../auth/room-identity";

export async function resolveMembershipState(
    db: DbType,
    roomId: string,
    ident: RoomIdentity
) {
    // 1. If we have a User ID, they take priority. Check for an existing membership.
    if (ident.userId) {
        const userMember = await getRoomMembershipByUserId(db, roomId, ident.userId);

        if (userMember) {
            return { membership: userMember, canMerge: false };
        }

        // 2. User exists but has no membership. 
        // Do they have a guest cookie we can merge?
        if (ident.guestUuid) {
            const guestMember = await getRoomMembershipByGuestId(db, roomId, ident.guestUuid);
            if (guestMember) {
                return { membership: guestMember, canMerge: true };
            }
        }
    }
    // Fallback to legacy behavior
    const standardMember = await getRoomMembership(db, ident, roomId);
    return { membership: standardMember, canMerge: false };
}

export async function getRoomMembership(
    db: DbType,
    identity: RoomIdentity,
    roomId: string,
): Promise<RoomMembership | null> {
    if (!identity.guestUuid && !identity.userId) {
        return null
    }
    return identity.userId
        ? await getRoomMembershipByUserId(db, roomId, identity.userId)
        : await getRoomMembershipByGuestId(db, roomId, identity.guestUuid!);
}

export async function getRoomMembershipByUserId(
    db: DbType,
    roomId: string,
    userId: string,
): Promise<RoomMembership | null> {

    const member = await db.query.roomMember.findFirst({
        where: and(eq(roomMember.roomId, roomId), eq(roomMember.userId, userId)),
    })

    if (!member) return null;

    const { id, ...rest } = member;
    return { roomMemberId: id, ...rest }
}

export async function getRoomMembershipByGuestId(
    db: DbType,
    roomId: string,
    guestId: string,
): Promise<RoomMembership | null> {

    const member = await db.query.roomMember.findFirst({
        where: and(eq(roomMember.roomId, roomId), eq(roomMember.guestUuid, guestId)),
    })

    if (!member) return null;

    const { id, ...rest } = member;
    return { roomMemberId: id, ...rest }
}

export async function editRoomMemberDisplayName(
    db: DbType,
    identity: RoomIdentity,
    roomId: string,
    displayName: string,
) {
    const updatedRoomMember = await db.transaction(async (tx) => {
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
    const { id, ...rest } = updatedRoomMember;
    return {
        roomMemberId: id,
        ...rest
    };
}

export async function upgradeRoomMember(
    db: DbType,
    identity: RoomIdentity,
    roomId: string,
) {
    if (!identity.guestUuid || !identity.userId) return null;
    const [member] = await db.update(roomMember)
        .set({ userId: identity.userId })
        .where(and(eq(roomMember.roomId, roomId), eq(roomMember.guestUuid, identity.guestUuid)))
        .returning();

    if (!member) return null;

    const { id, ...rest } = member;
    return { roomMemberId: id, ...rest }
}
