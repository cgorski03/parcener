import { and, eq, gte } from 'drizzle-orm';
import type { AppUser, DbType } from '@/shared/server/db';
import { receipt } from '@/shared/server/db';
import { getStartOfDayUTC } from '@/shared/server/utils/time';

const DAILY_UPLOAD_LIMIT = 3;

export async function getUserUploadRateLimit(db: DbType, user: AppUser) {
  if (!user.canUpload) {
    return {
      canUpload: false,
      used: 0,
      limit: DAILY_UPLOAD_LIMIT,
    };
  }

  const uploads = await _getUploadsToday(db, user.id);

  return {
    canUpload: uploads.length < DAILY_UPLOAD_LIMIT,
    used: uploads.length,
    limit: DAILY_UPLOAD_LIMIT,
  };
}

async function _getUploadsToday(db: DbType, userId: string) {
  const startOfDay = getStartOfDayUTC();
  return await db
    .select()
    .from(receipt)
    .where(and(eq(receipt.userId, userId), gte(receipt.createdAt, startOfDay)));
}
