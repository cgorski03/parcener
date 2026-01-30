import type { DbType } from '@/shared/server/db';
import { claim, room, roomMember } from '@/shared/server/db/schema';

type RoomOverrides = Partial<typeof room.$inferInsert>;

export async function createTestRoom(
  db: DbType,
  receiptId: string,
  createdBy: string,
  overrides: RoomOverrides = {},
) {
  const [created] = await db
    .insert(room)
    .values({
      receiptId,
      createdBy,
      title: overrides.title ?? 'Test Room',
      status: overrides.status ?? 'active',
      hostPaymentMethodId: overrides.hostPaymentMethodId ?? null,
    })
    .returning();

  return created;
}

type MemberOverrides = Partial<typeof roomMember.$inferInsert>;

export async function createTestRoomMember(
  db: DbType,
  roomId: string,
  overrides: MemberOverrides = {},
) {
  const [created] = await db
    .insert(roomMember)
    .values({
      roomId,
      userId: overrides.userId ?? null,
      guestUuid: overrides.guestUuid ?? null,
      displayName: overrides.displayName ?? 'Test Member',
    })
    .returning();

  return created;
}

export async function createTestClaim(
  db: DbType,
  roomId: string,
  memberId: string,
  receiptItemId: string,
  quantity: number = 1,
) {
  const [created] = await db
    .insert(claim)
    .values({
      roomId,
      memberId,
      receiptItemId,
      quantity: quantity.toString(),
    })
    .returning();

  return created;
}
