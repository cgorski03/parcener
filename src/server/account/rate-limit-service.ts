import { eq, and, gte } from "drizzle-orm";
import { AppUser, DbType, invite, receipt } from "../db";

const DAILY_UPLOAD_LIMIT = 3;
const DAILY_INVITE_LIMIT = 3;

export interface AccountResponse<T = any> {
    success: boolean;
    message?: string;
    data: T;
}

export function success<T>(data: T, message?: string): AccountResponse<T> {
    return { success: true, message, data };
}

export function failure<T>(message: string, data: T): AccountResponse<T> {
    return { success: false, message, data };
}

export async function GetUserUploadRateLimit(
    db: DbType,
    user: AppUser
): Promise<AccountResponse<{ canUpload: boolean; used: number; limit: number }>> {
    try {
        if (!user.canUpload) {
            return success({ canUpload: false, used: 0, limit: DAILY_UPLOAD_LIMIT });
        }

        const uploads = await getUserUploadsToday(db, user.id);
        return success({
            canUpload: uploads.length < DAILY_UPLOAD_LIMIT,
            used: uploads.length,
            limit: DAILY_UPLOAD_LIMIT,
        });
    } catch (error) {
        console.error("Failed to get user rate limit:", error);
        return failure(
            "Failed to retrieve upload rate limit",
            { canUpload: false, used: 0, limit: DAILY_UPLOAD_LIMIT }
        );
    }
}

export async function GetUserInviteRateLimit(
    db: DbType,
    user: AppUser
): Promise<AccountResponse<{ canInvite: boolean; used: number; limit: number }>> {
    try {
        if (!user.canUpload) {
            return failure("Can't invite", {
                canInvite: false,
                used: 0,
                limit: 0,
            })
        }
        console.log("getting invitations")
        const invitations = await getUserInvitationsToday(db, user.id);
        return success({
            canInvite: true,
            used: invitations.length,
            limit: DAILY_INVITE_LIMIT,
        });
    } catch (error) {
        console.error("Failed to get user invite rate limit:", error);
        return failure(
            "Failed to retrieve invite rate limit",
            { canInvite: false, used: 0, limit: DAILY_INVITE_LIMIT }
        );
    }
}

// Authorization functions
export async function authorizeUserUpload(
    db: DbType,
    user: AppUser
): Promise<AccountResponse<boolean>> {
    try {
        const rateLimitResult = await GetUserUploadRateLimit(db, user);

        if (!rateLimitResult.success) {
            return success(false, rateLimitResult.message);
        }

        const { canUpload, used, limit } = rateLimitResult.data;
        return success(canUpload && used < limit);
    } catch (error) {
        console.error("Failed to authorize user upload:", error);
        return failure("Authorization check failed", false);
    }
}

export async function authorizeUserCreateInvite(
    db: DbType,
    user: AppUser
): Promise<AccountResponse<boolean>> {
    try {
        const rateLimitResult = await GetUserInviteRateLimit(db, user);

        if (!rateLimitResult.success) {
            return success(false, rateLimitResult.message);
        }

        const { used, limit } = rateLimitResult.data;
        return success(used < limit);
    } catch (error) {
        console.error("Failed to authorize user create invite:", error);
        return failure("Authorization check failed", false);
    }
}

// Private helper functions
async function getUserUploadsToday(db: DbType, userId: string) {
    const now = new Date();
    const startOfDay = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    return await db
        .select()
        .from(receipt)
        .where(and(eq(receipt.userId, userId), gte(receipt.createdAt, startOfDay)));
}

async function getUserInvitationsToday(db: DbType, userId: string) {
    const now = new Date();
    const startOfDay = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    return await db
        .select()
        .from(invite)
        .where(and(eq(invite.createdBy, userId), gte(invite.createdAt, startOfDay)));
}

