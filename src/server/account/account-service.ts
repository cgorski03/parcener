import { eq, and, gte, isNull } from "drizzle-orm";
import { AppUser, DbType, invite, receipt, user } from "../db";

const DAILY_UPLOAD_LIMIT = 5;
const DAILY_INVITE_LIMIT = 1;

export interface AccountResponse<T = any> {
    success: boolean;
    message?: string;
    data: T;
}

function success<T>(data: T, message?: string): AccountResponse<T> {
    return { success: true, message, data };
}

function failure<T>(message: string, data: T): AccountResponse<T> {
    return { success: false, message, data };
}

export async function getUserRateLimit(
    db: DbType,
    user: AppUser
): Promise<AccountResponse<{ canUpload: boolean; used: number; limit: number }>> {
    try {
        if (!user.canUpload) {
            return success({ canUpload: false, used: 0, limit: DAILY_UPLOAD_LIMIT });
        }

        const uploads = await getUserUploadsToday(db, user.id);
        return success({
            canUpload: true,
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

export async function getUserInviteRateLimit(
    db: DbType,
    userId: string
): Promise<AccountResponse<{ used: number; limit: number }>> {
    try {
        const invitations = await getUserInvitationsToday(db, userId);
        return success({
            used: invitations.length,
            limit: DAILY_INVITE_LIMIT,
        });
    } catch (error) {
        console.error("Failed to get user invite rate limit:", error);
        return failure(
            "Failed to retrieve invite rate limit",
            { used: 0, limit: DAILY_INVITE_LIMIT }
        );
    }
}

// Authorization functions
export async function authorizeUserUpload(
    db: DbType,
    user: AppUser
): Promise<AccountResponse<boolean>> {
    try {
        const rateLimitResult = await getUserRateLimit(db, user);

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
    userId: string
): Promise<AccountResponse<boolean>> {
    try {
        const rateLimitResult = await getUserInviteRateLimit(db, userId);

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

// Main action functions
export type InviteStatus = 'SUCCESS' | 'NOT_FOUND' | 'USER_ALREADY_AUTHORIZED' | 'ERROR';

export async function AcceptInvitationToUpload(
    db: DbType,
    userId: string,
    inviteId: string
): Promise<AccountResponse<{ status: InviteStatus }>> {
    try {
        const userEntity = await db.query.user.findFirst({
            where: eq(user.id, userId),
            columns: { canUpload: true },
        });

        if (!userEntity) {
            return failure("User not found", { status: "ERROR" });
        }

        // I don't think it should consume the invite if the user is authorized already
        if (userEntity.canUpload) {
            return success({ status: "USER_ALREADY_AUTHORIZED" });
        }

        // Step 2: Atomic invite claim
        const claimedInvite = await db.transaction(async (tx) => {
            const result = await tx
                .update(invite)
                .set({ usedAt: new Date(), usedBy: userId })
                .where(
                    and(
                        eq(invite.id, inviteId),
                        isNull(invite.usedAt) // Race condition guard
                    )
                )
                .returning();
            return result[0];
        });

        if (!claimedInvite) {
            return failure("Invite not found or already used", { status: "NOT_FOUND" });
        }

        await db
            .update(user)
            .set({ canUpload: true })
            .where(eq(user.id, userId));

        return success({ status: "SUCCESS" });
    } catch (error) {
        console.error("Failed to accept invitation:", error);
        return failure("Failed to accept invitation", { status: "ERROR" });
    }
}

export async function CreateUploadInvitation(
    db: DbType,
    userId: string
): Promise<AccountResponse<{ status: "RATE_LIMIT" | "SUCCESS" | "ERROR"; inviteId?: string }>> {
    try {
        const authResult = await authorizeUserCreateInvite(db, userId);

        if (!authResult.success || !authResult.data) {
            return failure("Rate limit exceeded", { status: "RATE_LIMIT" });
        }

        const [newInvitation] = await db.insert(invite).values({
            createdBy: userId,
        }).returning();

        return success({
            status: "SUCCESS",
            inviteId: newInvitation.id,
        });
    } catch (error) {
        console.error("Failed to create invitation:", error);
        return failure("Failed to create invitation", { status: "ERROR" });
    }
}
