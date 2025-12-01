import { eq, and, gte } from "drizzle-orm";
import { AppUser, DbType, receipt } from "../db";

const DAILY_UPLOAD_LIMIT = 5;

export type CanUploadRateLimitResponse = {
    used: number,
    limit: number,
}

type NoUploadRateLimitResponse = {
    canUpload: false
}
export type RateLimitResponse = NoUploadRateLimitResponse | CanUploadRateLimitResponse;
export async function getUserRateLimit(db: DbType, user: AppUser): Promise<RateLimitResponse> {

    if (!user.canUpload) {
        return { canUpload: false }
    }
    const uploads = await getUserUploadsToday(db, user.id);
    return {
        used: uploads.length,
        limit: DAILY_UPLOAD_LIMIT,
    }
}

export async function authorizeUserUpload(db: DbType, user: AppUser): Promise<boolean> {
    const rateLimit = await getUserRateLimit(db, user);
    if ('canUpload' in rateLimit) {
        return false;
    }
    return rateLimit.used < rateLimit.limit;
}


async function getUserUploadsToday(db: DbType, userId: string) {
    const now = new Date();
    const startOfDay = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
    ));

    return await db
        .select()
        .from(receipt)
        .where(
            and(
                eq(receipt.userId, userId),
                gte(receipt.createdAt, startOfDay)
            )
        );
}
