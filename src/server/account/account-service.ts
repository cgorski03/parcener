import { eq, and, gte, isNull } from "drizzle-orm";
import { AppUser, DbType, Invite, invite, receipt, user } from "../db";

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


export type AcceptInvitationResponse {
    success: boolean;
    status: 'SUCCESS' | 'NOT_FOUND' | 'USER_ALREADY_AUTHORIZED' | 'ERROR';
    message?: string;
}

export async function AcceptInvitationToUpload(
    db: DbType,
    userId: string,
    inviteId: string
): Promise<AcceptInvitationResponse> {
    const userEntity = await db.query.user.findFirst({
        where: eq(user.id, userId),
        columns: { canUpload: true }
    });

    if (!userEntity) {
        return { success: false, status: 'ERROR', message: 'User not found' };
    }

    // I don't think it should consume the invite if the user is authorized already
    if (user.canUpload) {
        return { success: true, status: 'USER_ALREADY_AUTHORIZED' };
    }
    // Step 2: Atomic invite claim 
    let claimedInvite: Invite | undefined;

    try {
        [claimedInvite] = await db.transaction(async (tx) => {
            return await tx.update(invite)
                .set({ usedAt: new Date(), usedBy: userId })
                .where(and(
                    eq(invite.id, inviteId),
                    isNull(invite.usedAt) // Race condition guard
                ))
                .returning();
        });

    } catch (error) {
        return { success: false, status: 'ERROR', message: 'Failed to claim invite' };
    }

    if (!claimedInvite) {
        return { success: false, status: 'NOT_FOUND' };
    }

    try {
        await db.update(user)
            .set({ canUpload: true })
            .where(eq(user.id, userId));
    } catch (error) {
        console.error('Failed to update user:', error);
        return { success: false, status: 'ERROR', message: 'Failed to grant authorization' };
    }
    return { success: true, status: 'SUCCESS' };
}





