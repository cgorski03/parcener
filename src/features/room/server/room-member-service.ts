import { and, eq } from 'drizzle-orm';
import { touchRoomId } from './room-service';
import type { DbType } from '@/shared/server/db';
import type { RoomIdentity } from '@/shared/auth/server/room-identity';
import type { RoomMembership } from '@/shared/dto/types';
import { roomMember } from '@/shared/server/db';

export async function resolveMembershipState(
  db: DbType,
  roomId: string,
  ident: RoomIdentity,
) {
  // 1. If we have a User ID, they take priority. Check for an existing membership.
  if (ident.userId) {
    const userMember = await getRoomMembershipByUserId(
      db,
      roomId,
      ident.userId,
    );

    if (userMember) {
      return { membership: userMember, canMerge: false };
    }

    // 2. User exists but has no membership.
    // Do they have a guest cookie we can merge?
    if (ident.guestUuid) {
      const guestMember = await getRoomMembershipByGuestId(
        db,
        roomId,
        ident.guestUuid,
      );
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
    return null;
  }

  // Check for guest membership first (needed for guest->user upgrade)
  if (identity.guestUuid) {
    const guestMember = await getRoomMembershipByGuestId(
      db,
      roomId,
      identity.guestUuid,
    );
    if (guestMember) return guestMember;
  }

  return identity.userId
    ? await getRoomMembershipByUserId(db, roomId, identity.userId)
    : null;
}

export async function getRoomMembershipByUserId(
  db: DbType,
  roomId: string,
  userId: string,
): Promise<RoomMembership | null> {
  const member = await db.query.roomMember.findFirst({
    where: and(eq(roomMember.roomId, roomId), eq(roomMember.userId, userId)),
  });

  if (!member) return null;

  const { id, ...rest } = member;
  return { roomMemberId: id, ...rest };
}

export async function getRoomMembershipByGuestId(
  db: DbType,
  roomId: string,
  guestId: string,
): Promise<RoomMembership | null> {
  const member = await db.query.roomMember.findFirst({
    where: and(
      eq(roomMember.roomId, roomId),
      eq(roomMember.guestUuid, guestId),
    ),
  });

  if (!member) return null;

  const { id, ...rest } = member;
  return { roomMemberId: id, ...rest };
}

export async function editRoomMemberDisplayName(
  db: DbType,
  identity: RoomIdentity,
  roomId: string,
  displayName: string,
) {
  const updatedMember = await db.transaction(async (tx) => {
    const [member] = await tx
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
      .returning();

    await touchRoomId(tx, roomId);
    return member;
  });
  const { id, ...rest } = updatedMember;
  return {
    roomMemberId: id,
    ...rest,
  };
}

export async function upgradeRoomMember(
  db: DbType,
  identity: RoomIdentity,
  roomId: string,
) {
  if (!identity.guestUuid || !identity.userId) return null;
  const members = await db
    .update(roomMember)
    .set({ userId: identity.userId })
    .where(
      and(
        eq(roomMember.roomId, roomId),
        eq(roomMember.guestUuid, identity.guestUuid),
      ),
    )
    .returning();

  if (members.length === 0) return null;

  const { id, ...rest } = members[0];
  return { roomMemberId: id, ...rest };
}
