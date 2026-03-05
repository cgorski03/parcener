import { and, eq } from 'drizzle-orm';
import { getReceiptImageObject } from './internal';
import type { ReceiptImageAccessResult } from './internal-types';
import type { ApplicationAuthClient } from '@/shared/auth/server';
import type { DbType } from '@/shared/server/db';
import { getServerSession } from '@/shared/auth/server/get-server-session';
import { receipt } from '@/shared/server/db';

type ReceiptImageAccessRequest = {
  request: Request;
  receiptId: string;
  db: DbType;
  env: Env;
  auth: ApplicationAuthClient;
};

export async function getOwnedReceiptImageAccess(
  request: ReceiptImageAccessRequest,
): Promise<ReceiptImageAccessResult> {
  const { request: httpRequest, receiptId, db, env, auth } = request;

  const session = await getServerSession(httpRequest, auth);
  if (!session?.user.id) {
    return { type: 'forbidden' };
  }

  const ownedReceipt = await db.query.receipt.findFirst({
    where: and(eq(receipt.id, receiptId), eq(receipt.userId, session.user.id)),
    columns: { userId: true },
  });

  if (!ownedReceipt) {
    return { type: 'not_found' };
  }

  const image = await getReceiptImageObject(env, receiptId);

  if (!image) {
    return { type: 'not_found' };
  }

  return { type: 'ok', image };
}
