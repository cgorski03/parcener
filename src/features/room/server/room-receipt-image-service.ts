import { and, eq } from 'drizzle-orm';
import { resolveMembershipState } from './room-member-service';
import type { ApplicationAuthClient } from '@/shared/auth/server';
import type { DbType } from '@/shared/server/db';
import type { ReceiptImageAccessResult } from '@/features/receipt-review/server/internal-types';
import { getServerSession } from '@/shared/auth/server/get-server-session';
import { parseRoomIdentity } from '@/shared/auth/server/room-identity';
import { receipt, room } from '@/shared/server/db';
import { getReceiptImageObject } from '@/features/receipt-review/server/internal';

type RoomReceiptImageRequest = {
  request: Request;
  roomId: string;
  db: DbType;
  env: Env;
  auth: ApplicationAuthClient;
};

export async function getRoomReceiptImageAccess(
  request: RoomReceiptImageRequest,
): Promise<ReceiptImageAccessResult> {
  const { request: httpRequest, roomId, db, env, auth } = request;

  const session = await getServerSession(httpRequest, auth);
  const identity = parseRoomIdentity(httpRequest, roomId, session?.user);
  const { membership } = await resolveMembershipState(db, roomId, identity);

  // Get the receipt ID of the room
  const roomRecord = await db.query.room.findFirst({
    where: eq(room.id, roomId),
    columns: { receiptId: true },
  });

  if (!roomRecord) {
    return { type: 'not_found' };
  }

  // The user is not a member of the room, but it might be their receipt
  if (!membership) {
    if (!session?.user.id) {
      return { type: 'forbidden' };
    }

    const ownedReceipt = await db.query.receipt.findFirst({
      where: and(
        eq(receipt.id, roomRecord.receiptId),
        eq(receipt.userId, session.user.id),
      ),
      columns: { id: true },
    });

    if (!ownedReceipt) {
      return { type: 'not_found' };
    }
  }

  const image = await getReceiptImageObject(env, roomRecord.receiptId);
  if (!image) {
    return { type: 'not_found' };
  }

  return { type: 'ok', image };
}
