import { room, roomMember, claim } from '@/shared/server/db/schema';
import { testDb } from '../setup';

type RoomOverrides = Partial<typeof room.$inferInsert>;

export async function createTestRoom(
  receiptId: string,
  createdBy: string,
  overrides: RoomOverrides = {},
) {
  const [created] = await testDb
    .insert(room)
    .values({
      receiptId,
      createdBy,
      title: overrides.title ?? 'Test Room',
      hostPaymentMethodId: overrides.hostPaymentMethodId ?? null,
    })
    .returning();

  return created;
}

type MemberOverrides = Partial<typeof roomMember.$inferInsert>;

export async function createTestRoomMember(
  roomId: string,
  overrides: MemberOverrides = {},
) {
  const [created] = await testDb
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
  roomId: string,
  memberId: string,
  receiptItemId: string,
  quantity: number = 1,
) {
  const [created] = await testDb
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
